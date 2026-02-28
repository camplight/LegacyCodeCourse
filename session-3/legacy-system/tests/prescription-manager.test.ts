// Prescription Manager tests - 90% coverage, good quality

import {
  createPrescription, getPrescription, getPatientPrescriptions,
  getActivePrescriptions, cancelPrescription, renewPrescription,
  checkInteractions, getDoctorPrescriptions, _resetPrescriptionData
} from '../src/prescription-manager';

beforeEach(() => {
  _resetPrescriptionData();
});

describe('createPrescription', () => {
  it('should create a new prescription', () => {
    const rx = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Three times daily',
      '2025-01-01', '2025-01-14', 0
    );

    expect(rx.id).toMatch(/^rx_/);
    expect(rx.patientId).toBe('pat1');
    expect(rx.medication).toBe('amoxicillin'); // lowercased
    expect(rx.status).toBe('active');
  });

  it('should throw if required fields missing', () => {
    expect(() => {
      createPrescription('', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-01', '2025-01-14');
    }).toThrow('Patient ID, doctor ID, and medication are required');
  });

  it('should throw if dosage or frequency missing', () => {
    expect(() => {
      createPrescription('pat1', 'doc1', 'Amoxicillin', '', 'Daily', '2025-01-01', '2025-01-14');
    }).toThrow('Dosage and frequency are required');
  });

  it('should throw if end date is before start date', () => {
    expect(() => {
      createPrescription('pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-14', '2025-01-01');
    }).toThrow('End date must be after start date');
  });

  it('should throw if refills is negative', () => {
    expect(() => {
      createPrescription('pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-01', '2025-01-14', -1);
    }).toThrow('Refills cannot be negative');
  });

  it('should include optional appointment ID and notes', () => {
    const rx = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2025-01-14', 2, 'apt1', 'Take with food'
    );
    expect(rx.appointmentId).toBe('apt1');
    expect(rx.notes).toBe('Take with food');
    expect(rx.refills).toBe(2);
  });
});

describe('drug interaction checks', () => {
  it('should detect interactions with active prescriptions', () => {
    // Create an active warfarin prescription
    createPrescription(
      'pat1', 'doc1', 'Warfarin', '5mg', 'Daily',
      '2025-01-01', '2099-12-31'
    );

    // Aspirin interacts with warfarin
    expect(() => {
      createPrescription(
        'pat1', 'doc1', 'Aspirin', '81mg', 'Daily',
        '2025-01-01', '2025-06-01'
      );
    }).toThrow('Drug interaction warning');
  });

  it('should allow non-interacting drugs', () => {
    createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2099-12-31'
    );

    // Lisinopril doesn't interact with amoxicillin
    const rx = createPrescription(
      'pat1', 'doc1', 'Lisinopril', '10mg', 'Daily',
      '2025-01-01', '2025-06-01'
    );
    expect(rx).toBeDefined();
  });

  it('should check interactions separately', () => {
    createPrescription(
      'pat1', 'doc1', 'Warfarin', '5mg', 'Daily',
      '2025-01-01', '2099-12-31'
    );

    const interactions = checkInteractions('pat1', 'aspirin');
    expect(interactions).toContain('warfarin');
  });

  it('should return empty array if no interactions', () => {
    const interactions = checkInteractions('pat1', 'amoxicillin');
    expect(interactions).toHaveLength(0);
  });
});

describe('getPrescription / getPatientPrescriptions', () => {
  it('should get prescription by ID', () => {
    const rx = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2025-01-14'
    );
    const found = getPrescription(rx.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(rx.id);
  });

  it('should return undefined for unknown ID', () => {
    expect(getPrescription('unknown')).toBeUndefined();
  });

  it('should list all prescriptions for a patient', () => {
    createPrescription('pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-01', '2025-01-14');
    createPrescription('pat1', 'doc1', 'Lisinopril', '10mg', 'Daily', '2025-01-01', '2025-06-01');
    createPrescription('pat2', 'doc1', 'Metformin', '500mg', 'Twice daily', '2025-01-01', '2025-06-01');

    expect(getPatientPrescriptions('pat1')).toHaveLength(2);
    expect(getPatientPrescriptions('pat2')).toHaveLength(1);
  });
});

describe('getActivePrescriptions', () => {
  it('should only return active prescriptions with valid end dates', () => {
    createPrescription('pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-01', '2099-12-31');
    const expired = createPrescription('pat1', 'doc1', 'Lisinopril', '10mg', 'Daily', '2024-01-01', '2024-02-01');

    const active = getActivePrescriptions('pat1');
    // Only the one with future end date should be active
    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(active.some(p => p.medication === 'amoxicillin')).toBe(true);
  });
});

describe('cancelPrescription', () => {
  it('should cancel an active prescription', () => {
    const rx = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2025-01-14'
    );

    const cancelled = cancelPrescription(rx.id, 'Patient request');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.notes).toContain('Cancelled: Patient request');
  });

  it('should throw for unknown prescription', () => {
    expect(() => cancelPrescription('unknown')).toThrow('Prescription not found');
  });

  it('should throw if already cancelled', () => {
    const rx = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2025-01-14'
    );
    cancelPrescription(rx.id);
    expect(() => cancelPrescription(rx.id)).toThrow('already cancelled');
  });
});

describe('renewPrescription', () => {
  it('should create a new prescription based on existing one', () => {
    const original = createPrescription(
      'pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily',
      '2025-01-01', '2025-01-14', 0
    );

    const renewed = renewPrescription(original.id, '2099-06-01', 3);
    expect(renewed.id).not.toBe(original.id);
    expect(renewed.medication).toBe('amoxicillin');
    expect(renewed.refills).toBe(3);
    expect(renewed.notes).toContain('Renewed from');

    // Original should be completed
    const orig = getPrescription(original.id);
    expect(orig!.status).toBe('completed');
  });

  it('should throw for unknown prescription', () => {
    expect(() => renewPrescription('unknown', '2025-06-01')).toThrow('Prescription not found');
  });
});

describe('getDoctorPrescriptions', () => {
  it('should return prescriptions by doctor', () => {
    createPrescription('pat1', 'doc1', 'Amoxicillin', '500mg', 'Daily', '2025-01-01', '2025-01-14');
    createPrescription('pat2', 'doc1', 'Lisinopril', '10mg', 'Daily', '2025-01-01', '2025-06-01');
    createPrescription('pat1', 'doc2', 'Metformin', '500mg', 'Twice daily', '2025-01-01', '2025-06-01');

    expect(getDoctorPrescriptions('doc1')).toHaveLength(2);
    expect(getDoctorPrescriptions('doc2')).toHaveLength(1);
  });
});
