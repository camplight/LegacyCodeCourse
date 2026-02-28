// Patient Registry tests - 40% coverage, brittle snapshot-style tests

import {
  registerPatient, getPatient,
  _resetPatientData
} from '../src/patient-registry';

beforeEach(() => {
  _resetPatientData();
});

describe('registerPatient', () => {
  it('should register a new patient', () => {
    const patient = registerPatient({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      dateOfBirth: '1990-01-15'
    });

    // brittle: checking exact shape rather than behavior
    expect(patient).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      dateOfBirth: '1990-01-15',
      status: 'active'
    });
    expect(patient.id).toMatch(/^pat_/);
  });

  it('should throw for missing name', () => {
    expect(() => registerPatient({ email: 'test@test.com' })).toThrow('Patient name is required');
  });

  it('should throw for invalid email', () => {
    expect(() => registerPatient({
      name: 'John Doe',
      email: 'not-an-email'
    })).toThrow('Invalid email');
  });

  it('should throw for duplicate patient', () => {
    registerPatient({ name: 'John Doe', dateOfBirth: '1990-01-15' });
    expect(() => {
      registerPatient({ name: 'John Doe', dateOfBirth: '1990-01-15' });
    }).toThrow('already exists');
  });

  // NOTE: missing tests for:
  // - patient without email (should still work)
  // - patient with address as object vs string
  // - patient with medical history
  // - edge cases with empty strings
});

describe('getPatient', () => {
  it('should get patient by id', () => {
    const patient = registerPatient({ name: 'Jane Doe', email: 'jane@example.com' });
    const found = getPatient(patient.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Jane Doe');
  });

  it('should return undefined for unknown patient', () => {
    expect(getPatient('nonexistent')).toBeUndefined();
  });

  // NOTE: missing tests for:
  // - searchPatients
  // - updatePatient
  // - addMedicalHistory
  // - deactivatePatient
  // - getPatientsByStatus
  // - getAllPatients
});
