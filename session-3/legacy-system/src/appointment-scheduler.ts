// Appointment Scheduler
// Handles: scheduling, rescheduling, cancellation, validation,
//   conflict detection, billing integration, notifications, caching

import { Appointment } from './models';
import { generateId, isTimeSlotOverlap } from './utils';
import { getDoctor, isDoctorAvailable } from './doctor-schedule';
import { getPatient } from './patient-registry';
import { createInvoice, cancelInvoice } from './billing-service';
import { sendAppointmentConfirmation, sendCancellationNotice } from './notification-service';

// Global mutable state
var appointments: Appointment[] = [];
var appointmentCache: any = {};   // cache by date for "performance"
var processingSlots: any = {};    // lock mechanism that doesn't really work

// Constants
var MIN_APPOINTMENT_DURATION = 15;
var MAX_APPOINTMENT_DURATION = 120;
var MAX_DAILY_APPOINTMENTS_PER_DOCTOR = 20;
var CANCELLATION_WINDOW_HOURS = 24;
var BUSINESS_START_HOUR = 8;
var BUSINESS_END_HOUR = 18;
var DEFAULT_DURATION = 30;

export function scheduleAppointment(
  patientId: string,
  doctorId: string,
  date: string,
  time: string,
  type: string,
  duration?: number,
  notes?: string
): Appointment {
  var patient = validatePatientExists(patientId);
  var doctor = validateDoctorExists(doctorId);
  validateNotInPast(date, time, 'Cannot schedule appointment in the past');
  validateAppointmentType(type);
  var dur = resolveDuration(duration);
  validateBusinessHoursStart(time);
  validateBusinessHoursEnd(time, dur);

  var isEmergency = type === 'emergency';
  checkDoctorScheduleAvailability(doctorId, date, time, dur, isEmergency);

  var doctorAppointments = getActiveDoctorAppointments(doctorId, date);
  checkMaxDailyLimit(doctorAppointments, isEmergency);
  checkDoctorTimeConflicts(doctorAppointments, time, dur, isEmergency);
  checkPatientTimeConflicts(patientId, date, time, dur);

  // Slot locking (broken concurrency handling)
  var slotKey = doctorId + '_' + date + '_' + time;
  if (processingSlots[slotKey]) {
    throw new Error('This slot is currently being processed');
  }
  processingSlots[slotKey] = true;

  try {
    var appointment: Appointment = {
      id: generateId('apt'),
      patientId: patientId,
      doctorId: doctorId,
      date: date,
      time: time,
      duration: dur,
      type: type,
      status: 'scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      reminderSent: false
    };

    appointments.push(appointment);
    _updateCache(date, appointment);
    tryCreateBilling(appointment, patient.insuranceProvider);
    trySendConfirmation(patient, doctor, date, time, appointment.id);

    return appointment;

  } finally {
    delete processingSlots[slotKey];
  }
}

export function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Appointment {
  var appointment = findAppointmentOrThrow(appointmentId);

  if (appointment.status === 'cancelled') {
    throw new Error('Cannot reschedule cancelled appointment');
  }
  if (appointment.status === 'completed') {
    throw new Error('Cannot reschedule completed appointment');
  }

  // Reschedule uses a combined check (different error message from schedule)
  var patient = getPatient(appointment.patientId);
  var doctor = getDoctor(appointment.doctorId);
  if (!patient || !doctor) {
    throw new Error('Patient or doctor not found');
  }

  validateNotInPast(newDate, newTime, 'Cannot reschedule to a past date');
  validateBusinessHoursStart(newTime);
  // NOTE: reschedule intentionally does NOT call validateBusinessHoursEnd or
  // checkDoctorScheduleAvailability — these are known gaps preserved from original

  var doctorAppointments = getActiveDoctorAppointments(appointment.doctorId, newDate, appointmentId);
  checkDoctorTimeConflicts(doctorAppointments, newTime, appointment.duration, false);

  var oldDate = appointment.date;
  appointment.date = newDate;
  appointment.time = newTime;
  appointment.updatedAt = new Date().toISOString();

  _removeCacheEntry(oldDate, appointmentId);
  _updateCache(newDate, appointment);
  tryUpdateBilling(appointment, patient.insuranceProvider);
  trySendConfirmation(patient, doctor, newDate, newTime, appointment.id);

  return appointment;
}

export function cancelAppointment(appointmentId: string, reason?: string): Appointment {
  var appointment = findAppointmentOrThrow(appointmentId);

  if (appointment.status === 'cancelled') {
    throw new Error('Appointment already cancelled');
  }

  // check cancellation window
  var appointmentDateTime = new Date(appointment.date + 'T' + appointment.time);
  var hoursUntil = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < CANCELLATION_WINDOW_HOURS && hoursUntil > 0) {
    console.warn('Late cancellation for appointment ' + appointmentId);
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = reason || 'No reason provided';
  appointment.updatedAt = new Date().toISOString();

  _removeCacheEntry(appointment.date, appointmentId);
  tryCancelBilling(appointment.billingId);

  var patient = getPatient(appointment.patientId);
  var doctor = getDoctor(appointment.doctorId);
  if (patient && doctor) {
    trySendCancellation(patient, doctor, appointment.date, appointment.time);
  }

  return appointment;
}

export function getAppointment(appointmentId: string): Appointment | undefined {
  return appointments.find(function(a) { return a.id === appointmentId; });
}

export function getAppointmentsByDate(date: string): Appointment[] {
  // try cache first
  if (appointmentCache[date]) {
    return appointmentCache[date];
  }
  // fallback to filter
  return appointments.filter(function(a) { return a.date === date && a.status !== 'cancelled'; });
}

export function getAppointmentsByDoctor(doctorId: string, date?: string): Appointment[] {
  return appointments.filter(function(a) {
    if (a.doctorId !== doctorId) return false;
    if (a.status === 'cancelled') return false;
    if (date && a.date !== date) return false;
    return true;
  });
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return appointments.filter(function(a) {
    return a.patientId === patientId;
  });
}

export function completeAppointment(appointmentId: string): Appointment {
  var appointment = findAppointmentOrThrow(appointmentId);
  appointment.status = 'completed';
  appointment.updatedAt = new Date().toISOString();
  return appointment;
}

export function markNoShow(appointmentId: string): Appointment {
  var appointment = findAppointmentOrThrow(appointmentId);
  appointment.status = 'no-show';
  appointment.updatedAt = new Date().toISOString();
  return appointment;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validatePatientExists(patientId: string) {
  var patient = getPatient(patientId);
  if (!patient) {
    throw new Error('Patient not found: ' + patientId);
  }
  return patient;
}

function validateDoctorExists(doctorId: string) {
  var doctor = getDoctor(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found: ' + doctorId);
  }
  return doctor;
}

function validateNotInPast(date: string, time: string, message: string) {
  if (new Date(date + 'T' + time) < new Date()) {
    throw new Error(message);
  }
}

function validateAppointmentType(type: string) {
  var validTypes = ['checkup', 'followup', 'emergency', 'consultation', 'specialist'];
  if (validTypes.indexOf(type) === -1) {
    throw new Error('Invalid appointment type: ' + type);
  }
}

function resolveDuration(duration?: number): number {
  var dur = duration || DEFAULT_DURATION;
  if (dur < MIN_APPOINTMENT_DURATION || dur > MAX_APPOINTMENT_DURATION) {
    throw new Error('Duration must be between ' + MIN_APPOINTMENT_DURATION + ' and ' + MAX_APPOINTMENT_DURATION + ' minutes');
  }
  return dur;
}

function validateBusinessHoursStart(time: string) {
  var hour = parseInt(time.split(':')[0]);
  if (hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR) {
    throw new Error('Appointments must be between ' + BUSINESS_START_HOUR + ':00 and ' + BUSINESS_END_HOUR + ':00');
  }
}

function validateBusinessHoursEnd(time: string, duration: number) {
  var timeParts = time.split(':');
  var hour = parseInt(timeParts[0]);
  var minute = parseInt(timeParts[1]);
  var endMinutes = hour * 60 + minute + duration;
  if (endMinutes > BUSINESS_END_HOUR * 60) {
    throw new Error('Appointment would extend past business hours');
  }
}

// ---------------------------------------------------------------------------
// Conflict detection helpers
// ---------------------------------------------------------------------------

function getActiveDoctorAppointments(doctorId: string, date: string, excludeId?: string): Appointment[] {
  return appointments.filter(function(a) {
    if (a.doctorId !== doctorId) return false;
    if (a.date !== date) return false;
    if (a.status === 'cancelled') return false;
    if (excludeId && a.id === excludeId) return false;
    return true;
  });
}

function checkDoctorScheduleAvailability(doctorId: string, date: string, time: string, duration: number, isEmergency: boolean) {
  if (!isDoctorAvailable(doctorId, date, time, duration)) {
    if (!isEmergency) {
      throw new Error('Doctor is not available at this time');
    }
  }
}

function checkMaxDailyLimit(doctorAppointments: Appointment[], isEmergency: boolean) {
  if (doctorAppointments.length >= MAX_DAILY_APPOINTMENTS_PER_DOCTOR) {
    if (!isEmergency) {
      throw new Error('Doctor has reached maximum daily appointments');
    }
  }
}

function checkDoctorTimeConflicts(doctorAppointments: Appointment[], time: string, duration: number, isEmergency: boolean) {
  for (var i = 0; i < doctorAppointments.length; i++) {
    var existing = doctorAppointments[i];
    if (isTimeSlotOverlap(time, duration, existing.time, existing.duration)) {
      if (isEmergency) {
        console.warn('WARNING: Emergency appointment double-booked with ' + existing.id);
      } else {
        throw new Error('Time slot conflict with existing appointment');
      }
    }
  }
}

function checkPatientTimeConflicts(patientId: string, date: string, time: string, duration: number) {
  var patientAppointments = appointments.filter(function(a) {
    return a.patientId === patientId && a.date === date && a.status !== 'cancelled';
  });
  for (var j = 0; j < patientAppointments.length; j++) {
    if (isTimeSlotOverlap(time, duration, patientAppointments[j].time, patientAppointments[j].duration)) {
      throw new Error('Patient already has an appointment at this time');
    }
  }
}

// ---------------------------------------------------------------------------
// Side effect helpers
// ---------------------------------------------------------------------------

function tryCreateBilling(appointment: Appointment, insuranceProvider?: string) {
  try {
    var invoice = createInvoice(appointment, insuranceProvider);
    appointment.billingId = invoice.id;
  } catch (billingError) {
    console.error('Billing failed for appointment ' + appointment.id + ': ' + billingError);
  }
}

function tryUpdateBilling(appointment: Appointment, insuranceProvider?: string) {
  if (appointment.billingId) {
    try {
      cancelInvoice(appointment.billingId);
      var newInvoice = createInvoice(appointment, insuranceProvider);
      appointment.billingId = newInvoice.id;
    } catch (e) {
      console.error('Billing update failed during reschedule: ' + e);
    }
  }
}

function tryCancelBilling(billingId?: string) {
  if (billingId) {
    try {
      cancelInvoice(billingId);
    } catch (e) {
      console.error('Could not cancel invoice: ' + e);
    }
  }
}

function trySendConfirmation(patient: any, doctor: any, date: string, time: string, appointmentId: string) {
  try {
    sendAppointmentConfirmation(patient.email, patient.name, doctor.name, date, time, appointmentId);
  } catch (e) {
    console.error('Notification failed: ' + e);
  }
}

function trySendCancellation(patient: any, doctor: any, date: string, time: string) {
  try {
    sendCancellationNotice(patient.email, patient.name, doctor.name, date, time);
  } catch (e) {
    // swallowed
  }
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

function findAppointmentOrThrow(appointmentId: string): Appointment {
  var appointment = appointments.find(function(a) { return a.id === appointmentId; });
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  return appointment;
}

// ---------------------------------------------------------------------------
// Cache helpers - buggy
function _updateCache(date: string, appointment: Appointment): void {
  if (!appointmentCache[date]) {
    appointmentCache[date] = [];
  }
  appointmentCache[date].push(appointment);
}

function _removeCacheEntry(date: string, appointmentId: string): void {
  if (appointmentCache[date]) {
    appointmentCache[date] = appointmentCache[date].filter(function(a: any) {
      return a.id !== appointmentId;
    });
    if (appointmentCache[date].length === 0) {
      delete appointmentCache[date];
    }
  }
}

// Get all appointments (for reporting)
export function getAllAppointments(): Appointment[] {
  return appointments;
}

// Reset for testing
export function _resetAppointmentData(): void {
  appointments = [];
  appointmentCache = {};
  processingSlots = {};
}
