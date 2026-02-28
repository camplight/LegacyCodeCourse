// Doctor Schedule tests - 75% coverage, reasonable quality

import {
  addDoctor, getDoctor, getAllDoctors, getDoctorsBySpecialty,
  setSchedule, getSchedule, getWeekSchedule,
  isDoctorAvailable, getAvailableSlots, _resetDoctorData
} from '../src/doctor-schedule';

beforeEach(() => {
  _resetDoctorData();
});

describe('addDoctor', () => {
  it('should add a new doctor', () => {
    const doctor = addDoctor({
      id: 'doc1',
      name: 'Dr. Smith',
      specialty: 'General',
      email: 'smith@clinic.com',
      active: true,
      workingHours: {}
    });

    expect(doctor.id).toBe('doc1');
    expect(doctor.name).toBe('Dr. Smith');
  });

  it('should throw if doctor already exists', () => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: 'smith@clinic.com', active: true, workingHours: {} });
    expect(() => {
      addDoctor({ id: 'doc1', name: 'Dr. Jones', specialty: 'Cardiology', email: 'jones@clinic.com', active: true, workingHours: {} });
    }).toThrow('Doctor already exists');
  });

  it('should throw if required fields missing', () => {
    expect(() => {
      addDoctor({ id: '', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
    }).toThrow('Doctor must have id, name, and specialty');
  });

  it('should default active to true', () => {
    const doctor = addDoctor({
      id: 'doc1', name: 'Dr. Smith', specialty: 'General',
      email: 'smith@clinic.com', active: undefined as any, workingHours: {}
    });
    expect(doctor.active).not.toBe(false);
  });
});

describe('getDoctor / getAllDoctors', () => {
  it('should retrieve a doctor by id', () => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: 'smith@clinic.com', active: true, workingHours: {} });
    const doc = getDoctor('doc1');
    expect(doc).toBeDefined();
    expect(doc!.name).toBe('Dr. Smith');
  });

  it('should return undefined for unknown doctor', () => {
    expect(getDoctor('unknown')).toBeUndefined();
  });

  it('should list all active doctors', () => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
    addDoctor({ id: 'doc2', name: 'Dr. Jones', specialty: 'Cardiology', email: '', active: true, workingHours: {} });
    expect(getAllDoctors()).toHaveLength(2);
  });

  it('should filter by specialty', () => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
    addDoctor({ id: 'doc2', name: 'Dr. Jones', specialty: 'Cardiology', email: '', active: true, workingHours: {} });
    expect(getDoctorsBySpecialty('Cardiology')).toHaveLength(1);
  });
});

describe('setSchedule / getSchedule', () => {
  beforeEach(() => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
  });

  it('should set a schedule for a day', () => {
    const schedule = setSchedule('doc1', 1, { start: '09:00', end: '17:00' });
    expect(schedule.doctorId).toBe('doc1');
    expect(schedule.dayOfWeek).toBe(1);
  });

  it('should get schedule for a day', () => {
    setSchedule('doc1', 1, { start: '09:00', end: '17:00' });
    const schedule = getSchedule('doc1', 1);
    expect(schedule).toBeDefined();
    expect(schedule!.workingHours.start).toBe('09:00');
  });

  it('should get full week schedule', () => {
    setSchedule('doc1', 1, { start: '09:00', end: '17:00' });
    setSchedule('doc1', 2, { start: '09:00', end: '17:00' });
    setSchedule('doc1', 3, { start: '09:00', end: '17:00' });
    const week = getWeekSchedule('doc1');
    expect(week).toHaveLength(3);
  });

  it('should throw for non-existent doctor', () => {
    expect(() => {
      setSchedule('unknown', 1, { start: '09:00', end: '17:00' });
    }).toThrow('Doctor not found');
  });

  it('should throw for invalid day of week', () => {
    expect(() => {
      setSchedule('doc1', 7, { start: '09:00', end: '17:00' });
    }).toThrow('Invalid day of week');
  });

  it('should throw if start is after end', () => {
    expect(() => {
      setSchedule('doc1', 1, { start: '17:00', end: '09:00' });
    }).toThrow('Working hours start must be before end');
  });
});

describe('isDoctorAvailable', () => {
  beforeEach(() => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
    // Monday (2025-07-07 is a Monday)
    setSchedule('doc1', 1, { start: '09:00', end: '17:00' }, [{ start: '12:00', end: '13:00' }]);
  });

  it('should return true for available slot', () => {
    expect(isDoctorAvailable('doc1', '2025-07-07', '10:00', 30)).toBe(true);
  });

  it('should return false during break', () => {
    expect(isDoctorAvailable('doc1', '2025-07-07', '12:00', 30)).toBe(false);
  });

  it('should return false outside working hours', () => {
    expect(isDoctorAvailable('doc1', '2025-07-07', '08:00', 30)).toBe(false);
  });

  it('should return false if no schedule for that day', () => {
    expect(isDoctorAvailable('doc1', '2025-07-08', '10:00', 30)).toBe(false); // Tuesday, no schedule
  });
});

describe('getAvailableSlots', () => {
  beforeEach(() => {
    addDoctor({ id: 'doc1', name: 'Dr. Smith', specialty: 'General', email: '', active: true, workingHours: {} });
    setSchedule('doc1', 1, { start: '09:00', end: '12:00' }, [{ start: '10:30', end: '11:00' }]);
  });

  it('should return available 30-minute slots', () => {
    const slots = getAvailableSlots('doc1', '2025-07-07', 30);
    expect(slots).toContain('09:00');
    expect(slots).toContain('09:30');
    expect(slots).toContain('10:00');
    // 10:30 is during break
    expect(slots).not.toContain('10:30');
    expect(slots).toContain('11:00');
    expect(slots).toContain('11:30');
  });

  it('should return empty for unscheduled day', () => {
    const slots = getAvailableSlots('doc1', '2025-07-08', 30);
    expect(slots).toHaveLength(0);
  });

  // NOTE: missing test for custom slot durations (gap in coverage)
});
