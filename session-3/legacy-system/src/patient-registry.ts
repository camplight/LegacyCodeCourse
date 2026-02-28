// Patient Registry - handles patient CRUD and search
// NOTE: some of this was ported from a PHP system, hence the style
// Last major update: who knows

import { Patient } from './models';
import { generateId, validateEmail, searchPatientsByName } from './utils';

// Global patient store
var patients: Patient[] = [];

// register new patient
export function registerPatient(data: any): Patient {
  // validate required fields... sort of
  if (!data.name) {
    throw new Error('Patient name is required');
  }

  // sometimes email comes in, sometimes not
  if (data.email && !validateEmail(data.email)) {
    throw new Error('Invalid email');
  }

  // check for duplicates by name + DOB (not great, but it's what we have)
  var isDuplicate = false;
  for (var i = 0; i < patients.length; i++) {
    if (patients[i].name.toLowerCase() === data.name.toLowerCase() &&
        patients[i].dateOfBirth === data.dateOfBirth) {
      isDuplicate = true;
      break;
    }
  }
  if (isDuplicate) {
    throw new Error('Patient with same name and date of birth already exists');
  }

  var patient: Patient = {
    id: data.id || generateId('pat'),
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    dateOfBirth: data.dateOfBirth || '',
    medicalHistory: data.medicalHistory || [],
    insuranceProvider: data.insuranceProvider,
    insuranceId: data.insuranceId,
    address: data.address || '',
    createdAt: new Date().toISOString(),
    notes: data.notes || '',
    status: 'active'
  };

  patients.push(patient);
  return patient;
}

// get patient by id
export function getPatient(patientId: string): Patient | undefined {
  for (var i = 0; i < patients.length; i++) {
    if (patients[i].id === patientId) {
      return patients[i];
    }
  }
  return undefined;
}

export function getAllPatients(): Patient[] {
  return patients;
}

// update patient - replaces whole record (dangerous, but it works)
export function updatePatient(patientId: string, data: any): Patient {
  var index = -1;
  for (var i = 0; i < patients.length; i++) {
    if (patients[i].id === patientId) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    throw new Error('Patient not found');
  }

  // just merge everything, hope for the best
  var updated = Object.assign({}, patients[index], data);
  updated.id = patientId; // don't let them change the id
  patients[index] = updated;
  return updated;
}

// search patients
// WARNING: the query param is used directly in matching, no sanitization
export function searchPatients(query: string): Patient[] {
  if (!query || query.trim() === '') {
    return patients;
  }

  // use the shared helper from utils
  var byName = searchPatientsByName(patients, query);
  if (byName.length > 0) return byName;

  // also try searching by email, phone, insurance
  var results: Patient[] = [];
  var q = query.toLowerCase();
  for (var i = 0; i < patients.length; i++) {
    var p = patients[i];
    if ((p.email && p.email.toLowerCase().indexOf(q) >= 0) ||
        (p.phone && p.phone.indexOf(q) >= 0) ||
        (p.insuranceId && p.insuranceId.toLowerCase().indexOf(q) >= 0)) {
      results.push(p);
    }
  }
  return results;
}

// add to medical history
export function addMedicalHistory(patientId: string, entry: any): Patient {
  var patient = getPatient(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  // no validation on the entry format, different parts of the system
  // pass different shaped objects
  if (!patient.medicalHistory) {
    patient.medicalHistory = [];
  }

  entry.date = entry.date || new Date().toISOString();
  patient.medicalHistory.push(entry);

  return patient;
}

// deactivate patient (don't delete, just mark inactive)
export function deactivatePatient(patientId: string): Patient {
  var patient = getPatient(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }
  patient.status = 'inactive';
  return patient;
}

// get patients by status
export function getPatientsByStatus(status: string): Patient[] {
  return patients.filter(function(p) {
    return p.status === status;
  });
}

// Reset for testing
export function _resetPatientData(): void {
  patients = [];
}
