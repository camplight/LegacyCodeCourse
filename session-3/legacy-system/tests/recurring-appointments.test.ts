/**
 * TDD tests for recurring appointment feature.
 *
 * API:
 *   POST /api/appointments/recurring
 *     body: { patientId, doctorId, date, time, type, recurrence: { type: 'weekly'|'monthly', occurrences: number }, duration?, notes? }
 *     201: { success: true, data: { seriesId: string, appointments: Appointment[] } }
 *     400: { success: false, error: string }
 *
 *   GET /api/appointments/series/:seriesId
 *     200: { success: true, data: Appointment[] }
 *     404: { success: false, error: 'Series not found' }
 *
 *   PUT /api/appointments/series/:seriesId/cancel
 *     200: { success: true, data: { cancelled: number, appointments: Appointment[] } }
 *     404: { success: false, error: 'Series not found' }
 */

import request from 'supertest';
import { app } from '../src/server';
import { _resetAppointmentData, scheduleAppointment } from '../src/appointment-scheduler';
import { _resetDoctorData, addDoctor, setSchedule } from '../src/doctor-schedule';
import { _resetPatientData, registerPatient } from '../src/patient-registry';
import { _resetBillingData } from '../src/billing-service';
import { _resetNotificationData } from '../src/notification-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE_DATE = '2028-06-14'; // Wednesday (dayOfWeek = 3)

let origRandom: () => number;

beforeAll(() => { origRandom = Math.random; });
afterAll(() => { Math.random = origRandom; });

beforeEach(() => {
  let counter = 0;
  Math.random = () => { counter++; return 0.1 + (counter % 800) / 1000; };

  _resetAppointmentData();
  _resetDoctorData();
  _resetPatientData();
  _resetBillingData();
  _resetNotificationData();
});

function seedPatient(overrides: Record<string, any> = {}) {
  return registerPatient({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5551234567',
    dateOfBirth: '1990-01-15',
    insuranceProvider: 'BlueCross',
    ...overrides,
  });
}

/** Doctor available every day of the week — avoids needing to calculate which day monthly occurrences land on */
function seedDoctorAllDays() {
  const doc = addDoctor({
    id: 'doc_1',
    name: 'Dr. Smith',
    specialty: 'general',
    email: 'smith@clinic.com',
    active: true,
    workingHours: {},
  });
  for (let dow = 0; dow < 7; dow++) {
    setSchedule(doc.id, dow, { start: '08:00', end: '18:00' }, []);
  }
  return doc;
}

function postRecurring(body: Record<string, any>) {
  return request(app).post('/api/appointments/recurring').send(body);
}

/** Parse a YYYY-MM-DD string as local time (avoids UTC midnight timezone issues) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ===========================================================================
// POST /api/appointments/recurring — input validation
// ===========================================================================

describe('POST /api/appointments/recurring — validation', () => {
  it('rejects invalid recurrence type', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'daily', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid recurrence type: must be weekly or monthly');
  });

  it('rejects occurrences below minimum (2)', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 1 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Occurrences must be between 2 and 26');
  });

  it('rejects occurrences above maximum (26)', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 27 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Occurrences must be between 2 and 26');
  });

  it('rejects unknown patient', async () => {
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: 'nonexistent',
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Patient not found');
  });

  it('rejects unknown doctor', async () => {
    const patient = seedPatient();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: 'nonexistent',
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Doctor not found');
  });

  it('rejects past start date', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: '2020-01-01',
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot schedule appointment in the past');
  });

  it('rejects invalid appointment type', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'dental',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid appointment type: dental');
  });

  it('rejects appointment outside business hours', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '07:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointments must be between 8:00 and 18:00');
  });
});

// ===========================================================================
// POST /api/appointments/recurring — weekly happy path
// ===========================================================================

describe('POST /api/appointments/recurring — weekly', () => {
  it('creates the correct number of appointments', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointments).toHaveLength(4);
  });

  it('returns a seriesId in the response', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.seriesId).toBeTruthy();
    expect(typeof res.body.data.seriesId).toBe('string');
  });

  it('all appointments share the same seriesId', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    const { seriesId, appointments } = res.body.data;
    for (const apt of appointments) {
      expect(apt.seriesId).toBe(seriesId);
    }
  });

  it('appointments are exactly 7 days apart', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    const dates = res.body.data.appointments.map((a: any) => a.date);
    for (let i = 1; i < dates.length; i++) {
      const prev = parseLocalDate(dates[i - 1]);
      const curr = parseLocalDate(dates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
    }
  });

  it('first appointment is on the requested start date', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.body.data.appointments[0].date).toBe(FUTURE_DATE);
  });

  it('all appointments are at the requested time', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '10:30',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 3 },
    });
    for (const apt of res.body.data.appointments) {
      expect(apt.time).toBe('10:30');
    }
  });

  it('all appointments have status scheduled', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    for (const apt of res.body.data.appointments) {
      expect(apt.status).toBe('scheduled');
    }
  });

  it('all appointments have billing invoices created', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 3 },
    });
    for (const apt of res.body.data.appointments) {
      expect(apt.billingId).toMatch(/^inv_/);
    }
  });

  it('accepts optional duration and notes', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'followup',
      duration: 45,
      notes: 'Follow-up series',
      recurrence: { type: 'weekly', occurrences: 2 },
    });
    expect(res.status).toBe(201);
    for (const apt of res.body.data.appointments) {
      expect(apt.duration).toBe(45);
      expect(apt.notes).toBe('Follow-up series');
    }
  });
});

// ===========================================================================
// POST /api/appointments/recurring — monthly happy path
// ===========================================================================

describe('POST /api/appointments/recurring — monthly', () => {
  it('creates the correct number of monthly appointments', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'monthly', occurrences: 3 },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.appointments).toHaveLength(3);
  });

  it('monthly appointments are on the same day-of-month', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'monthly', occurrences: 3 },
    });
    const dates = res.body.data.appointments.map((a: any) => a.date);
    const startDay = parseLocalDate(dates[0]).getDate();
    for (const dateStr of dates) {
      expect(parseLocalDate(dateStr).getDate()).toBe(startDay);
    }
  });

  it('consecutive monthly appointments differ by exactly 1 month', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'monthly', occurrences: 4 },
    });
    const dates = res.body.data.appointments.map((a: any) => a.date);
    for (let i = 1; i < dates.length; i++) {
      const prev = parseLocalDate(dates[i - 1]);
      const curr = parseLocalDate(dates[i]);
      const monthDiff = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
      expect(monthDiff).toBe(1);
    }
  });
});

// ===========================================================================
// POST /api/appointments/recurring — conflict detection
// ===========================================================================

describe('POST /api/appointments/recurring — conflict detection', () => {
  it('fails the whole series if any occurrence has a time slot conflict', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();

    // Block the 2nd weekly occurrence (7 days after FUTURE_DATE)
    const [y, m, d] = FUTURE_DATE.split('-').map(Number);
    const blockDate = new Date(y, m - 1, d + 7);
    const blockDateStr = blockDate.getFullYear() + '-' +
      String(blockDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(blockDate.getDate()).padStart(2, '0');

    const patient2 = seedPatient({ name: 'Other Patient', dateOfBirth: '1985-01-01' });
    scheduleAppointment(patient2.id, doc.id, blockDateStr, '09:00', 'checkup', 30);

    const res = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Time slot conflict with existing appointment');
  });

  it('does not create any appointments if a later occurrence conflicts', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();

    // Block the 3rd occurrence
    const [y, m, d] = FUTURE_DATE.split('-').map(Number);
    const blockDate = new Date(y, m - 1, d + 14);
    const blockDateStr = blockDate.getFullYear() + '-' +
      String(blockDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(blockDate.getDate()).padStart(2, '0');

    const patient2 = seedPatient({ name: 'Blocker', dateOfBirth: '1975-06-01' });
    scheduleAppointment(patient2.id, doc.id, blockDateStr, '09:00', 'checkup', 30);

    await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });

    // No appointments for the original patient should have been created
    const getRes = await request(app).get(`/api/appointments?patientId=${patient.id}`);
    const patientApts = getRes.body.data.filter((a: any) => a.patientId === patient.id);
    expect(patientApts).toHaveLength(0);
  });
});

// ===========================================================================
// GET /api/appointments/series/:seriesId
// ===========================================================================

describe('GET /api/appointments/series/:seriesId', () => {
  it('returns all appointments in a series', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const created = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    const { seriesId } = created.body.data;

    const res = await request(app).get(`/api/appointments/series/${seriesId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(4);
    for (const apt of res.body.data) {
      expect(apt.seriesId).toBe(seriesId);
    }
  });

  it('returns 404 for a nonexistent seriesId', async () => {
    const res = await request(app).get('/api/appointments/series/nonexistent-series');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Series not found');
  });
});

// ===========================================================================
// PUT /api/appointments/series/:seriesId/cancel
// ===========================================================================

describe('PUT /api/appointments/series/:seriesId/cancel', () => {
  it('cancels all scheduled appointments in the series', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const created = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 4 },
    });
    const { seriesId } = created.body.data;

    const res = await request(app).put(`/api/appointments/series/${seriesId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cancelled).toBe(4);
    expect(res.body.data.appointments).toHaveLength(4);
    for (const apt of res.body.data.appointments) {
      expect(apt.status).toBe('cancelled');
    }
  });

  it('does not cancel already-completed appointments in the series', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const created = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      recurrence: { type: 'weekly', occurrences: 3 },
    });
    const { seriesId, appointments } = created.body.data;

    // Mark the first appointment as completed
    await request(app).put(`/api/appointments/${appointments[0].id}/complete`);

    const res = await request(app).put(`/api/appointments/series/${seriesId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.data.cancelled).toBe(2); // only 2 of the 3 were scheduled
    const statuses = res.body.data.appointments.map((a: any) => a.status);
    expect(statuses).not.toContain('completed');
  });

  it('returns 404 for a nonexistent seriesId', async () => {
    const res = await request(app).put('/api/appointments/series/nonexistent/cancel');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Series not found');
  });

  it('cancelled appointments in series are freed for rebooking', async () => {
    const patient = seedPatient();
    const doc = seedDoctorAllDays();
    const created = await postRecurring({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 30,
      recurrence: { type: 'weekly', occurrences: 2 },
    });
    const { seriesId } = created.body.data;
    await request(app).put(`/api/appointments/series/${seriesId}/cancel`);

    // Should now be able to rebook the same slot
    const patient2 = seedPatient({ name: 'New Patient', dateOfBirth: '1995-05-05' });
    const rebookRes = await request(app).post('/api/appointments').send({
      patientId: patient2.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 30,
    });
    expect(rebookRes.status).toBe(201);
  });
});
