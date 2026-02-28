// Doctor schedule management
// Relatively well-maintained module

import { Doctor } from './models';

interface TimeSlot {
  start: string;  // HH:MM
  end: string;    // HH:MM
}

interface DoctorSchedule {
  doctorId: string;
  dayOfWeek: number;  // 0 = Sunday, 6 = Saturday
  workingHours: TimeSlot;
  breaks: TimeSlot[];
}

// In-memory storage
var doctors: Doctor[] = [];
var schedules: DoctorSchedule[] = [];

export function addDoctor(doctor: Doctor): Doctor {
  if (!doctor.id || !doctor.name || !doctor.specialty) {
    throw new Error('Doctor must have id, name, and specialty');
  }

  var existing = doctors.find(d => d.id === doctor.id);
  if (existing) {
    throw new Error('Doctor already exists: ' + doctor.id);
  }

  doctors.push({ ...doctor, active: doctor.active !== false });
  return doctor;
}

export function getDoctor(doctorId: string): Doctor | undefined {
  return doctors.find(d => d.id === doctorId);
}

export function getAllDoctors(): Doctor[] {
  return doctors.filter(d => d.active);
}

export function getDoctorsBySpecialty(specialty: string): Doctor[] {
  return doctors.filter(d => d.active && d.specialty.toLowerCase() === specialty.toLowerCase());
}

export function updateDoctor(doctorId: string, updates: Partial<Doctor>): Doctor {
  var index = doctors.findIndex(d => d.id === doctorId);
  if (index === -1) {
    throw new Error('Doctor not found: ' + doctorId);
  }

  if (updates.id && updates.id !== doctorId) {
    throw new Error('Cannot change doctor ID');
  }

  var updated = Object.assign({}, doctors[index], updates);
  updated.id = doctorId;
  doctors[index] = updated;
  return updated;
}

export function deactivateDoctor(doctorId: string): Doctor {
  var doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) {
    throw new Error('Doctor not found: ' + doctorId);
  }
  if (!doctor.active) {
    throw new Error('Doctor already inactive');
  }
  doctor.active = false;

  // Also remove all their schedules
  schedules = schedules.filter(s => s.doctorId !== doctorId);
  return doctor;
}

export function removeSchedule(doctorId: string, dayOfWeek: number): boolean {
  var before = schedules.length;
  schedules = schedules.filter(s => !(s.doctorId === doctorId && s.dayOfWeek === dayOfWeek));
  return schedules.length < before;
}

export function getDoctorWorkload(doctorId: string): { day: number; hours: number }[] {
  var doctorSchedules = schedules.filter(s => s.doctorId === doctorId);
  var workload: { day: number; hours: number }[] = [];

  for (var sched of doctorSchedules) {
    var start = parseTime(sched.workingHours.start);
    var end = parseTime(sched.workingHours.end);
    var totalBreakMinutes = 0;
    for (var brk of sched.breaks) {
      totalBreakMinutes += parseTime(brk.end) - parseTime(brk.start);
    }
    workload.push({
      day: sched.dayOfWeek,
      hours: (end - start - totalBreakMinutes) / 60
    });
  }

  return workload;
}

export function setSchedule(doctorId: string, dayOfWeek: number, workingHours: TimeSlot, breaks: TimeSlot[] = []): DoctorSchedule {
  var doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) {
    throw new Error('Doctor not found: ' + doctorId);
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('Invalid day of week: ' + dayOfWeek);
  }

  // Validate working hours
  var startMinutes = parseTime(workingHours.start);
  var endMinutes = parseTime(workingHours.end);
  if (startMinutes >= endMinutes) {
    throw new Error('Working hours start must be before end');
  }

  // Remove existing schedule for this day
  schedules = schedules.filter(s => !(s.doctorId === doctorId && s.dayOfWeek === dayOfWeek));

  var schedule: DoctorSchedule = {
    doctorId,
    dayOfWeek,
    workingHours,
    breaks: breaks || []
  };

  schedules.push(schedule);
  return schedule;
}

export function getSchedule(doctorId: string, dayOfWeek: number): DoctorSchedule | undefined {
  return schedules.find(s => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek);
}

export function getWeekSchedule(doctorId: string): DoctorSchedule[] {
  return schedules.filter(s => s.doctorId === doctorId).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export function isDoctorAvailable(doctorId: string, date: string, time: string, duration: number): boolean {
  var dayOfWeek = new Date(date).getDay();
  var schedule = schedules.find(s => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek);

  if (!schedule) return false;

  var timeMinutes = parseTime(time);
  var endTime = timeMinutes + duration;

  // Check within working hours
  var workStart = parseTime(schedule.workingHours.start);
  var workEnd = parseTime(schedule.workingHours.end);

  if (timeMinutes < workStart || endTime > workEnd) {
    return false;
  }

  // Check not during a break
  for (var brk of schedule.breaks) {
    var breakStart = parseTime(brk.start);
    var breakEnd = parseTime(brk.end);
    if (timeMinutes < breakEnd && endTime > breakStart) {
      return false;
    }
  }

  return true;
}

export function getAvailableSlots(doctorId: string, date: string, slotDuration: number = 30): string[] {
  var dayOfWeek = new Date(date).getDay();
  var schedule = schedules.find(s => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek);

  if (!schedule) return [];

  var slots: string[] = [];
  var workStart = parseTime(schedule.workingHours.start);
  var workEnd = parseTime(schedule.workingHours.end);

  for (var current = workStart; current + slotDuration <= workEnd; current += slotDuration) {
    var isDuringBreak = false;
    for (var brk of schedule.breaks) {
      var breakStart = parseTime(brk.start);
      var breakEnd = parseTime(brk.end);
      if (current < breakEnd && (current + slotDuration) > breakStart) {
        isDuringBreak = true;
        break;
      }
    }
    if (!isDuringBreak) {
      slots.push(minutesToTime(current));
    }
  }

  return slots;
}

function parseTime(time: string): number {
  var [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// Reset for testing
export function _resetDoctorData(): void {
  doctors = [];
  schedules = [];
}
