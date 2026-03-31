/**
 * Characterization tests for appointment scheduling API endpoints.
 *
 * These tests lock the CURRENT externally-observable behavior of the system
 * (including quirks and suspected bugs) as a safety net for future refactors.
 *
 * Nondeterminism controls:
 *   - Math.random is seeded/stubbed to eliminate notification random failures
 *   - Generated IDs are normalized in snapshots via regex
 *   - Timestamps (createdAt, updatedAt, sentAt) are normalized
 *   - All module state is reset between tests via _reset* functions
 *
 * Mocking decisions:
 *   - Math.random: stubbed to return 0.5 (avoids notification random failures)
 *   - No other mocks — all modules run real code paths (in-memory stores)
 */

import request from 'supertest';
import { app } from '../src/server';
import { _resetAppointmentData } from '../src/appointment-scheduler';
import { _resetDoctorData, addDoctor, setSchedule } from '../src/doctor-schedule';
import { _resetPatientData, registerPatient } from '../src/patient-registry';
import { _resetBillingData } from '../src/billing-service';
import { _resetNotificationData } from '../src/notification-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A future date that is always a Wednesday (dayOfWeek=3) and well in the future */
const FUTURE_DATE = '2028-06-14'; // Wednesday
const FUTURE_DATE_DOW = 3;

/** Normalize nondeterministic fields so snapshots are stable */
function normalize(body: any): any {
  const json = JSON.stringify(body);
  return JSON.parse(
    json
      // generated IDs: apt_xxxx, pat_xxxx, inv_xxxx, doc_xxxx etc.
      .replace(/\b(apt|pat|inv|doc|rx)_[a-z0-9]+/g, '$1_ID')
      // ISO timestamps
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, 'TIMESTAMP')
  );
}

let origRandom: () => number;

beforeAll(() => {
  origRandom = Math.random;
});

afterAll(() => {
  Math.random = origRandom;
});

beforeEach(() => {
  // Deterministic random — avoids notification-service random failures (threshold 0.1)
  // Uses a counter so generateId() produces unique IDs across calls
  let randomCounter = 0;
  Math.random = () => {
    randomCounter++;
    return 0.1 + (randomCounter % 800) / 1000; // always > 0.1, always < 0.91
  };

  // Reset all module-level state
  _resetAppointmentData();
  _resetDoctorData();
  _resetPatientData();
  _resetBillingData();
  _resetNotificationData();
});

/** Register a test patient and return the patient object */
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

/** Register a test doctor, set a Wednesday schedule, return the doctor */
function seedDoctor(overrides: Record<string, any> = {}) {
  const doc = addDoctor({
    id: 'doc_1',
    name: 'Dr. Smith',
    specialty: 'general',
    email: 'smith@clinic.com',
    active: true,
    workingHours: {},
    ...overrides,
  });
  // Set Wednesday schedule: 08:00–18:00, lunch break 12:00–13:00
  setSchedule(doc.id, FUTURE_DATE_DOW, { start: '08:00', end: '18:00' }, [
    { start: '12:00', end: '13:00' },
  ]);
  return doc;
}

/** Convenience: seed both patient + doctor, return their IDs */
function seedBoth() {
  const patient = seedPatient();
  const doctor = seedDoctor();
  return { patientId: patient.id, doctorId: doctor.id };
}

/** Schedule an appointment via the API and return the supertest response */
function postAppointment(body: Record<string, any>) {
  return request(app).post('/api/appointments').send(body);
}

// ===========================================================================
// POST /api/appointments — scheduleAppointment
// ===========================================================================

describe('POST /api/appointments', () => {
  // --- Happy path ---

  it('schedules a valid checkup and returns 201 with appointment data', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 30,
      notes: 'Annual physical',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const apt = res.body.data;
    expect(apt.id).toMatch(/^apt_/);
    expect(apt.patientId).toBe(patientId);
    expect(apt.doctorId).toBe(doctorId);
    expect(apt.date).toBe(FUTURE_DATE);
    expect(apt.time).toBe('09:00');
    expect(apt.duration).toBe(30);
    expect(apt.type).toBe('checkup');
    expect(apt.status).toBe('scheduled');
    expect(apt.notes).toBe('Annual physical');
    expect(apt.reminderSent).toBe(false);
    // Billing integration creates an invoice
    expect(apt.billingId).toMatch(/^inv_/);
  });

  it('defaults duration to 30 when not provided', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.duration).toBe(30);
  });

  it('defaults notes to empty string when not provided', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBe('');
  });

  it('accepts all valid appointment types', async () => {
    const { patientId, doctorId } = seedBoth();
    const types = ['checkup', 'followup', 'emergency', 'consultation', 'specialist'];
    for (const type of types) {
      _resetAppointmentData();
      const res = await postAppointment({
        patientId,
        doctorId,
        date: FUTURE_DATE,
        time: '09:00',
        type,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe(type);
    }
  });

  // --- Validation errors ---

  it('rejects unknown patient with 400', async () => {
    seedDoctor();
    const res = await postAppointment({
      patientId: 'nonexistent',
      doctorId: 'doc_1',
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Patient not found: nonexistent');
  });

  it('rejects unknown doctor with 400', async () => {
    const patient = seedPatient();
    const res = await postAppointment({
      patientId: patient.id,
      doctorId: 'nonexistent',
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Doctor not found: nonexistent');
  });

  it('rejects appointment in the past', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: '2020-01-01',
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot schedule appointment in the past');
  });

  it('rejects invalid appointment type', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'dental',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid appointment type: dental');
  });

  it('rejects duration below minimum (15 min)', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 10,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Duration must be between 15 and 120 minutes');
  });

  it('rejects duration above maximum (120 min)', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 150,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Duration must be between 15 and 120 minutes');
  });

  it('rejects appointment before business hours (08:00)', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '07:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointments must be between 8:00 and 18:00');
  });

  it('rejects appointment at or after business end (18:00)', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '18:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointments must be between 8:00 and 18:00');
  });

  it('rejects appointment that would extend past business hours', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '17:45',
      type: 'checkup',
      duration: 30,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment would extend past business hours');
  });

  // --- Doctor availability ---

  it('rejects when doctor has no schedule for that day', async () => {
    const patient = seedPatient();
    // Doctor exists but has no schedule set for Thursday (day 4)
    addDoctor({ id: 'doc_nosched', name: 'Dr. None', specialty: 'general', email: 'x@x.com', active: true, workingHours: {} });
    const res = await postAppointment({
      patientId: patient.id,
      doctorId: 'doc_nosched',
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Doctor is not available at this time');
  });

  it('rejects when appointment falls during doctor break', async () => {
    const { patientId, doctorId } = seedBoth();
    // Break is 12:00–13:00
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '12:30',
      type: 'checkup',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Doctor is not available at this time');
  });

  // --- Conflict detection ---

  it('rejects time slot conflict with existing appointment', async () => {
    const { patientId, doctorId } = seedBoth();
    // Book first appointment
    await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '10:00',
      type: 'checkup',
      duration: 30,
    });
    // Second patient for same doctor, overlapping time
    const patient2 = seedPatient({ name: 'John Doe', dateOfBirth: '1985-05-05' });
    const res = await postAppointment({
      patientId: patient2.id,
      doctorId,
      date: FUTURE_DATE,
      time: '10:15',
      type: 'checkup',
      duration: 30,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Time slot conflict with existing appointment');
  });

  it('rejects when patient already has appointment at same time', async () => {
    const patient = seedPatient();
    const doc1 = seedDoctor();
    const doc2 = addDoctor({ id: 'doc_2', name: 'Dr. Jones', specialty: 'cardiology', email: 'j@c.com', active: true, workingHours: {} });
    setSchedule(doc2.id, FUTURE_DATE_DOW, { start: '08:00', end: '18:00' }, []);

    // Book patient with doc1
    await postAppointment({
      patientId: patient.id,
      doctorId: doc1.id,
      date: FUTURE_DATE,
      time: '10:00',
      type: 'checkup',
      duration: 30,
    });
    // Same patient, different doctor, overlapping time
    const res = await postAppointment({
      patientId: patient.id,
      doctorId: doc2.id,
      date: FUTURE_DATE,
      time: '10:15',
      type: 'checkup',
      duration: 30,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Patient already has an appointment at this time');
  });

  it('allows non-overlapping appointments for same doctor', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 30,
    });
    const patient2 = seedPatient({ name: 'Bob', dateOfBirth: '1970-01-01' });
    const res = await postAppointment({
      patientId: patient2.id,
      doctorId,
      date: FUTURE_DATE,
      time: '09:30',
      type: 'checkup',
      duration: 30,
    });
    expect(res.status).toBe(201);
  });

  // --- Emergency override ---

  it('emergency overrides doctor availability check', async () => {
    const patient = seedPatient();
    // Doctor with no schedule for the given day
    addDoctor({ id: 'doc_nosched', name: 'Dr. None', specialty: 'general', email: 'x@x.com', active: true, workingHours: {} });
    // Non-emergency would fail, but set a schedule anyway to pass business hours
    // Actually, emergency still needs to pass business hours validation (it's checked before availability)
    // So we need a doctor WITH a schedule — emergency overrides isDoctorAvailable, not business hours
    const doc = addDoctor({ id: 'doc_emerg', name: 'Dr. Emerg', specialty: 'general', email: 'e@c.com', active: true, workingHours: {} });
    // No schedule for Wednesday — isDoctorAvailable returns false
    // But emergency type bypasses the availability check (appointment-scheduler.ts:90-93)
    // However, it still validates business hours at line 75.
    // To test the override we need to pass business hours but fail availability.
    // Set schedule for a DIFFERENT day so Wednesday has no schedule.
    setSchedule(doc.id, 4, { start: '08:00', end: '18:00' }, []); // Thursday only

    const res = await postAppointment({
      patientId: patient.id,
      doctorId: doc.id,
      date: FUTURE_DATE, // Wednesday — no schedule
      time: '09:00',
      type: 'emergency',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('emergency');
  });

  it('emergency overrides time slot conflict (double-books)', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '10:00',
      type: 'checkup',
      duration: 30,
    });
    const patient2 = seedPatient({ name: 'Emergency Patient', dateOfBirth: '2000-01-01' });
    const res = await postAppointment({
      patientId: patient2.id,
      doctorId,
      date: FUTURE_DATE,
      time: '10:00',
      type: 'emergency',
      duration: 30,
    });
    // NOTE: possible bug (characterized intentionally) — emergency double-books silently,
    // only a console.warn is emitted. No indication in the response.
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('emergency');
  });

  it('emergency overrides max daily appointments limit', async () => {
    // Use a doctor with NO lunch break so all 20 slots succeed
    const doc = addDoctor({ id: 'doc_full', name: 'Dr. Full', specialty: 'general', email: 'f@c.com', active: true, workingHours: {} });
    setSchedule(doc.id, FUTURE_DATE_DOW, { start: '08:00', end: '18:00' }, []); // no breaks

    // Fill 20 slots (MAX_DAILY_APPOINTMENTS_PER_DOCTOR)
    for (let i = 0; i < 20; i++) {
      const h = 8 + Math.floor(i / 4);
      const m = (i % 4) * 15;
      const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      const p = seedPatient({ name: `Patient ${i}`, dateOfBirth: `199${Math.floor(i/10)}-0${(i%9)+1}-15` });
      const r = await postAppointment({
        patientId: p.id,
        doctorId: doc.id,
        date: FUTURE_DATE,
        time,
        type: 'checkup',
        duration: 15,
      });
      expect(r.status).toBe(201); // confirm each slot filled
    }
    // 21st as emergency — should succeed
    const emergPat = seedPatient({ name: 'EmergPat', dateOfBirth: '1980-06-06' });
    const res = await postAppointment({
      patientId: emergPat.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '15:00',
      type: 'emergency',
      duration: 15,
    });
    expect(res.status).toBe(201);
  });

  it('non-emergency rejected when max daily appointments reached', async () => {
    // Use a doctor with NO lunch break so all 20 slots succeed
    const doc = addDoctor({ id: 'doc_full', name: 'Dr. Full', specialty: 'general', email: 'f@c.com', active: true, workingHours: {} });
    setSchedule(doc.id, FUTURE_DATE_DOW, { start: '08:00', end: '18:00' }, []); // no breaks

    for (let i = 0; i < 20; i++) {
      const h = 8 + Math.floor(i / 4);
      const m = (i % 4) * 15;
      const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      const p = seedPatient({ name: `Patient ${i}`, dateOfBirth: `199${Math.floor(i/10)}-0${(i%9)+1}-15` });
      const r = await postAppointment({
        patientId: p.id,
        doctorId: doc.id,
        date: FUTURE_DATE,
        time,
        type: 'checkup',
        duration: 15,
      });
      expect(r.status).toBe(201);
    }
    const extraPat = seedPatient({ name: 'ExtraPat', dateOfBirth: '1975-03-03' });
    const res = await postAppointment({
      patientId: extraPat.id,
      doctorId: doc.id,
      date: FUTURE_DATE,
      time: '15:00',
      type: 'checkup',
      duration: 15,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Doctor has reached maximum daily appointments');
  });

  // --- Side effects: billing ---

  it('creates a billing invoice as side effect', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    expect(res.status).toBe(201);
    const billingId = res.body.data.billingId;
    expect(billingId).toMatch(/^inv_/);

    // Verify invoice exists via billing API
    const invoiceRes = await request(app).get(`/api/billing/invoices/${billingId}`);
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.body.data.appointmentId).toBe(res.body.data.id);
  });

  // --- Snapshot of full response shape ---

  it('response shape snapshot (normalized)', async () => {
    const { patientId, doctorId } = seedBoth();
    const res = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '14:00',
      type: 'consultation',
      duration: 45,
      notes: 'First visit',
    });
    expect(res.status).toBe(201);
    expect(normalize(res.body)).toMatchSnapshot();
  });
});

// ===========================================================================
// GET /api/appointments/:id
// ===========================================================================

describe('GET /api/appointments/:id', () => {
  it('returns appointment by ID', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({
      patientId,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
    });
    const id = created.body.data.id;
    const res = await request(app).get(`/api/appointments/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.patientId).toBe(patientId);
  });

  it('returns 404 for nonexistent appointment', async () => {
    const res = await request(app).get('/api/appointments/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Appointment not found');
  });
});

// ===========================================================================
// GET /api/appointments?date=...&doctorId=...&patientId=...
// ===========================================================================

describe('GET /api/appointments (query)', () => {
  it('returns appointments by date', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '10:00', type: 'followup' });

    const res = await request(app).get(`/api/appointments?date=${FUTURE_DATE}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('by-date excludes cancelled appointments', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({ reason: 'test' });

    const res = await request(app).get(`/api/appointments?date=${FUTURE_DATE}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns appointments by doctorId', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app).get(`/api/appointments?doctorId=${doctorId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].doctorId).toBe(doctorId);
  });

  it('returns appointments by patientId', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app).get(`/api/appointments?patientId=${patientId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].patientId).toBe(patientId);
  });

  // NOTE: possible bug (characterized intentionally) — when both date and doctorId are
  // provided, the route only uses date (server.ts:184 checked first). doctorId is ignored.
  it('date takes precedence over doctorId when both provided', async () => {
    const { patientId, doctorId } = seedBoth();
    await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app).get(`/api/appointments?date=${FUTURE_DATE}&doctorId=other`);
    expect(res.status).toBe(200);
    // Returns appointments for the date, ignoring doctorId filter
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 400 when no query parameters provided', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Query parameter required: date, doctorId, or patientId');
  });

  it('returns empty array for date with no appointments', async () => {
    const res = await request(app).get('/api/appointments?date=2028-01-01');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  // NOTE: possible bug (characterized intentionally) — patientId query returns ALL
  // appointments including cancelled ones (getAppointmentsByPatient has no status filter).
  // getAppointmentsByDoctor and getAppointmentsByDate both exclude cancelled.
  it('patientId query includes cancelled appointments', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const res = await request(app).get(`/api/appointments?patientId=${patientId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('cancelled');
  });
});

// ===========================================================================
// PUT /api/appointments/:id/reschedule
// ===========================================================================

describe('PUT /api/appointments/:id/reschedule', () => {
  it('reschedules to a new date and time', async () => {
    const { patientId, doctorId } = seedBoth();
    // Also set Thursday schedule for rescheduling target
    setSchedule('doc_1', 4, { start: '08:00', end: '18:00' }, []);
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    const id = created.body.data.id;

    const newDate = '2028-06-15'; // Thursday
    const res = await request(app)
      .put(`/api/appointments/${id}/reschedule`)
      .send({ date: newDate, time: '14:00' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.date).toBe(newDate);
    expect(res.body.data.time).toBe('14:00');
    expect(res.body.data.updatedAt).toBeTruthy();
  });

  it('rejects rescheduling nonexistent appointment', async () => {
    const res = await request(app)
      .put('/api/appointments/nonexistent/reschedule')
      .send({ date: FUTURE_DATE, time: '10:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment not found');
  });

  it('rejects rescheduling cancelled appointment', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '14:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot reschedule cancelled appointment');
  });

  it('rejects rescheduling completed appointment', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/complete`);

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '14:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot reschedule completed appointment');
  });

  it('rejects rescheduling to past date', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: '2020-01-01', time: '10:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot reschedule to a past date');
  });

  it('rejects rescheduling outside business hours', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '19:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointments must be between 8:00 and 18:00');
  });

  it('rejects rescheduling into conflicting slot', async () => {
    const { patientId, doctorId } = seedBoth();
    const patient2 = seedPatient({ name: 'Other', dateOfBirth: '1970-01-01' });
    await postAppointment({ patientId: patient2.id, doctorId, date: FUTURE_DATE, time: '14:00', type: 'checkup', duration: 30 });
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup', duration: 30 });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '14:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Time slot conflict with existing appointment');
  });

  it('updates billing (cancels old invoice, creates new) on reschedule', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    const oldBillingId = created.body.data.billingId;

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '15:00' });
    expect(res.status).toBe(200);
    const newBillingId = res.body.data.billingId;

    // Old invoice should be cancelled
    const oldInv = await request(app).get(`/api/billing/invoices/${oldBillingId}`);
    expect(oldInv.body.data.status).toBe('cancelled');

    // New invoice should be pending
    const newInv = await request(app).get(`/api/billing/invoices/${newBillingId}`);
    expect(newInv.body.data.status).toBe('pending');
  });

  // NOTE: possible bug (characterized intentionally) — reschedule does NOT check
  // isDoctorAvailable (doctor schedule). It only checks for conflicting appointments.
  // This means you can reschedule into a doctor's break or a day with no schedule.
  it('reschedule does not check doctor schedule availability', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    // Reschedule into doctor's lunch break (12:00-13:00) — succeeds!
    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '12:30' });
    expect(res.status).toBe(200);
    expect(res.body.data.time).toBe('12:30');
  });

  // NOTE: possible bug (characterized intentionally) — reschedule does NOT check
  // whether the appointment end time exceeds business hours.
  // The scheduleAppointment checks endMinutes > BUSINESS_END_HOUR * 60,
  // but rescheduleAppointment only checks the start hour.
  it('reschedule does not validate end time past business hours', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup', duration: 120 });

    // Reschedule 120-min appointment to 17:00 — end would be 19:00, past business hours
    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/reschedule`)
      .send({ date: FUTURE_DATE, time: '17:00' });
    expect(res.status).toBe(200);
    expect(res.body.data.time).toBe('17:00');
  });
});

// ===========================================================================
// PUT /api/appointments/:id/cancel
// ===========================================================================

describe('PUT /api/appointments/:id/cancel', () => {
  it('cancels a scheduled appointment', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/appointments/${id}/cancel`)
      .send({ reason: 'Patient request' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.cancelReason).toBe('Patient request');
    expect(res.body.data.updatedAt).toBeTruthy();
  });

  it('defaults cancel reason to "No reason provided"', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/cancel`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.cancelReason).toBe('No reason provided');
  });

  it('rejects cancelling nonexistent appointment', async () => {
    const res = await request(app)
      .put('/api/appointments/nonexistent/cancel')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment not found');
  });

  it('rejects cancelling already cancelled appointment', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/cancel`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment already cancelled');
  });

  it('cancels associated invoice as side effect', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    const billingId = created.body.data.billingId;

    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const inv = await request(app).get(`/api/billing/invoices/${billingId}`);
    expect(inv.body.data.status).toBe('cancelled');
  });

  it('cancelled appointment no longer conflicts with new bookings', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup', duration: 30 });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const patient2 = seedPatient({ name: 'New Patient', dateOfBirth: '1995-01-01' });
    const res = await postAppointment({
      patientId: patient2.id,
      doctorId,
      date: FUTURE_DATE,
      time: '09:00',
      type: 'checkup',
      duration: 30,
    });
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// PUT /api/appointments/:id/complete
// ===========================================================================

describe('PUT /api/appointments/:id/complete', () => {
  it('marks appointment as completed', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.updatedAt).toBeTruthy();
  });

  it('rejects completing nonexistent appointment', async () => {
    const res = await request(app).put('/api/appointments/nonexistent/complete');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment not found');
  });

  // NOTE: possible bug (characterized intentionally) — completeAppointment does NOT
  // check current status. You can complete a cancelled or already-completed appointment.
  it('allows completing a cancelled appointment (no status guard)', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const res = await request(app).put(`/api/appointments/${created.body.data.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });
});

// ===========================================================================
// PUT /api/appointments/:id/no-show
// ===========================================================================

describe('PUT /api/appointments/:id/no-show', () => {
  it('marks appointment as no-show', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });

    const res = await request(app)
      .put(`/api/appointments/${created.body.data.id}/no-show`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('no-show');
    expect(res.body.data.updatedAt).toBeTruthy();
  });

  it('rejects no-show for nonexistent appointment', async () => {
    const res = await request(app).put('/api/appointments/nonexistent/no-show');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Appointment not found');
  });

  // NOTE: possible bug (characterized intentionally) — markNoShow does NOT check
  // current status. You can mark a cancelled appointment as no-show.
  it('allows no-show on cancelled appointment (no status guard)', async () => {
    const { patientId, doctorId } = seedBoth();
    const created = await postAppointment({ patientId, doctorId, date: FUTURE_DATE, time: '09:00', type: 'checkup' });
    await request(app).put(`/api/appointments/${created.body.data.id}/cancel`).send({});

    const res = await request(app).put(`/api/appointments/${created.body.data.id}/no-show`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('no-show');
  });
});
