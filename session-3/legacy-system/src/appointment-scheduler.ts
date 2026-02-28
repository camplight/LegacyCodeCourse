// Appointment Scheduler - THE BIG ONE
// Handles: scheduling, rescheduling, cancellation, validation,
//   conflict detection, billing integration, notifications, caching
// TODO: this file does too much, should be split up
// TODO: fix the caching bugs (again)
// TODO: someone please add tests

import { Appointment } from './models';
import { generateId, isTimeSlotOverlap, formatDate } from './utils';
import { getDoctor, isDoctorAvailable } from './doctor-schedule';
import { getPatient } from './patient-registry';
import { createInvoice, getInvoiceByAppointment, cancelInvoice } from './billing-service';
import { sendAppointmentConfirmation, sendCancellationNotice, sendAppointmentReminder } from './notification-service';

// Global mutable state
var appointments: Appointment[] = [];
var appointmentCache: any = {};   // cache by date for "performance"
var processingSlots: any = {};    // lock mechanism that doesn't really work

// Magic numbers
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
  // === VALIDATION (duplicated logic, should be extracted) ===

  // validate patient exists
  var patient = getPatient(patientId);
  if (!patient) {
    throw new Error('Patient not found: ' + patientId);
  }

  // validate doctor exists
  var doctor = getDoctor(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found: ' + doctorId);
  }

  // validate date is not in the past
  var appointmentDate = new Date(date + 'T' + time);
  var now = new Date();
  if (appointmentDate < now) {
    throw new Error('Cannot schedule appointment in the past');
  }

  // validate type
  var validTypes = ['checkup', 'followup', 'emergency', 'consultation', 'specialist'];
  if (validTypes.indexOf(type) === -1) {
    throw new Error('Invalid appointment type: ' + type);
  }

  // validate duration
  var dur = duration || DEFAULT_DURATION;
  if (dur < MIN_APPOINTMENT_DURATION || dur > MAX_APPOINTMENT_DURATION) {
    throw new Error('Duration must be between ' + MIN_APPOINTMENT_DURATION + ' and ' + MAX_APPOINTMENT_DURATION + ' minutes');
  }

  // validate business hours
  var timeParts = time.split(':');
  var hour = parseInt(timeParts[0]);
  var minute = parseInt(timeParts[1]);
  if (hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR) {
    throw new Error('Appointments must be between ' + BUSINESS_START_HOUR + ':00 and ' + BUSINESS_END_HOUR + ':00');
  }

  // Check if end time exceeds business hours
  var endMinutes = hour * 60 + minute + dur;
  if (endMinutes > BUSINESS_END_HOUR * 60) {
    throw new Error('Appointment would extend past business hours');
  }

  // === CONFLICT DETECTION (complex, nested) ===

  // check doctor availability from schedule
  if (!isDoctorAvailable(doctorId, date, time, dur)) {
    // but maybe it's emergency? emergency overrides schedule
    if (type !== 'emergency') {
      throw new Error('Doctor is not available at this time');
    }
  }

  // check for conflicting appointments
  var doctorAppointments = appointments.filter(function(a) {
    return a.doctorId === doctorId && a.date === date && a.status !== 'cancelled';
  });

  // check max daily appointments
  if (doctorAppointments.length >= MAX_DAILY_APPOINTMENTS_PER_DOCTOR) {
    if (type !== 'emergency') {
      throw new Error('Doctor has reached maximum daily appointments');
    }
  }

  // check time conflicts
  for (var i = 0; i < doctorAppointments.length; i++) {
    var existing = doctorAppointments[i];
    if (isTimeSlotOverlap(time, dur, existing.time, existing.duration)) {
      if (type === 'emergency') {
        // emergency can double-book, but we should note it
        console.warn('WARNING: Emergency appointment double-booked with ' + existing.id);
      } else {
        throw new Error('Time slot conflict with existing appointment');
      }
    }
  }

  // also check patient doesn't have another appointment at same time
  var patientAppointments = appointments.filter(function(a) {
    return a.patientId === patientId && a.date === date && a.status !== 'cancelled';
  });

  for (var j = 0; j < patientAppointments.length; j++) {
    if (isTimeSlotOverlap(time, dur, patientAppointments[j].time, patientAppointments[j].duration)) {
      throw new Error('Patient already has an appointment at this time');
    }
  }

  // === SLOT LOCKING (broken concurrency handling) ===
  var slotKey = doctorId + '_' + date + '_' + time;
  if (processingSlots[slotKey]) {
    throw new Error('This slot is currently being processed');
  }
  processingSlots[slotKey] = true;

  try {
    // === CREATE APPOINTMENT ===
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

    // === CACHE UPDATE (buggy) ===
    _updateCache(date, appointment);

    // === BILLING INTEGRATION ===
    try {
      var invoice = createInvoice(appointment, patient.insuranceProvider);
      appointment.billingId = invoice.id;
    } catch (billingError) {
      // billing failed but we still booked the appointment
      // this creates orphaned appointments with no billing
      console.error('Billing failed for appointment ' + appointment.id + ': ' + billingError);
    }

    // === NOTIFICATION ===
    try {
      sendAppointmentConfirmation(
        patient.email,
        patient.name,
        doctor.name,
        date,
        time,
        appointment.id
      );
    } catch (notifError) {
      // notification failed, appointment still created
      console.error('Notification failed: ' + notifError);
    }

    return appointment;

  } finally {
    // release the "lock"
    delete processingSlots[slotKey];
  }
}

export function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Appointment {
  var appointment = appointments.find(function(a) { return a.id === appointmentId; });
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status === 'cancelled') {
    throw new Error('Cannot reschedule cancelled appointment');
  }

  if (appointment.status === 'completed') {
    throw new Error('Cannot reschedule completed appointment');
  }

  // duplicated validation from scheduleAppointment
  var patient = getPatient(appointment.patientId);
  var doctor = getDoctor(appointment.doctorId);

  if (!patient || !doctor) {
    throw new Error('Patient or doctor not found');
  }

  // validate new date not in past
  var newDateTime = new Date(newDate + 'T' + newTime);
  if (newDateTime < new Date()) {
    throw new Error('Cannot reschedule to a past date');
  }

  // validate business hours (duplicated logic)
  var timeParts = newTime.split(':');
  var hour = parseInt(timeParts[0]);
  if (hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR) {
    throw new Error('Appointments must be between ' + BUSINESS_START_HOUR + ':00 and ' + BUSINESS_END_HOUR + ':00');
  }

  // check conflicts (duplicated logic)
  var doctorAppointments = appointments.filter(function(a) {
    return a.doctorId === appointment!.doctorId && a.date === newDate &&
      a.status !== 'cancelled' && a.id !== appointmentId;
  });

  for (var i = 0; i < doctorAppointments.length; i++) {
    var existing = doctorAppointments[i];
    if (isTimeSlotOverlap(newTime, appointment.duration, existing.time, existing.duration)) {
      throw new Error('Time slot conflict with existing appointment');
    }
  }

  // update the appointment
  var oldDate = appointment.date;
  appointment.date = newDate;
  appointment.time = newTime;
  appointment.updatedAt = new Date().toISOString();

  // update cache (remove from old date, add to new)
  _removeCacheEntry(oldDate, appointmentId);
  _updateCache(newDate, appointment);

  // cancel old invoice and create new one
  if (appointment.billingId) {
    try {
      cancelInvoice(appointment.billingId);
      var newInvoice = createInvoice(appointment, patient.insuranceProvider);
      appointment.billingId = newInvoice.id;
    } catch (e) {
      console.error('Billing update failed during reschedule: ' + e);
    }
  }

  // send notification
  try {
    sendAppointmentConfirmation(
      patient.email,
      patient.name,
      doctor.name,
      newDate,
      newTime,
      appointment.id
    );
  } catch (e) {
    // ignore
  }

  return appointment;
}

export function cancelAppointment(appointmentId: string, reason?: string): Appointment {
  var appointment = appointments.find(function(a) { return a.id === appointmentId; });
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status === 'cancelled') {
    throw new Error('Appointment already cancelled');
  }

  // check cancellation window
  var appointmentDateTime = new Date(appointment.date + 'T' + appointment.time);
  var hoursUntil = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < CANCELLATION_WINDOW_HOURS && hoursUntil > 0) {
    // late cancellation - still allow but note it
    console.warn('Late cancellation for appointment ' + appointmentId);
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = reason || 'No reason provided';
  appointment.updatedAt = new Date().toISOString();

  // remove from cache
  _removeCacheEntry(appointment.date, appointmentId);

  // cancel billing
  if (appointment.billingId) {
    try {
      cancelInvoice(appointment.billingId);
    } catch (e) {
      console.error('Could not cancel invoice: ' + e);
    }
  }

  // send cancellation notice
  var patient = getPatient(appointment.patientId);
  var doctor = getDoctor(appointment.doctorId);
  if (patient && doctor) {
    try {
      sendCancellationNotice(
        patient.email,
        patient.name,
        doctor.name,
        appointment.date,
        appointment.time
      );
    } catch (e) {
      // whatever
    }
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
  var appointment = appointments.find(function(a) { return a.id === appointmentId; });
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  appointment.status = 'completed';
  appointment.updatedAt = new Date().toISOString();
  return appointment;
}

export function markNoShow(appointmentId: string): Appointment {
  var appointment = appointments.find(function(a) { return a.id === appointmentId; });
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  appointment.status = 'no-show';
  appointment.updatedAt = new Date().toISOString();
  return appointment;
}

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
