// Prescription management
// One of the better-maintained modules in the system

import { Prescription } from './models';
import { generateId } from './utils';

// In-memory storage
var prescriptions: Prescription[] = [];

// Known drug interactions (simplified)
var drugInteractions: Record<string, string[]> = {
  'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
  'aspirin': ['warfarin', 'ibuprofen'],
  'lisinopril': ['potassium', 'spironolactone'],
  'metformin': ['alcohol', 'contrast-dye'],
  'simvastatin': ['erythromycin', 'clarithromycin', 'grapefruit'],
  'amoxicillin': ['methotrexate'],
  'ibuprofen': ['warfarin', 'aspirin', 'lithium'],
};

export function createPrescription(
  patientId: string,
  doctorId: string,
  medication: string,
  dosage: string,
  frequency: string,
  startDate: string,
  endDate: string,
  refills: number = 0,
  appointmentId?: string,
  notes?: string
): Prescription {
  if (!patientId || !doctorId || !medication) {
    throw new Error('Patient ID, doctor ID, and medication are required');
  }

  if (!dosage || !frequency) {
    throw new Error('Dosage and frequency are required');
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error('End date must be after start date');
  }

  if (refills < 0) {
    throw new Error('Refills cannot be negative');
  }

  // Check for drug interactions with active prescriptions
  var interactions = checkInteractions(patientId, medication);
  if (interactions.length > 0) {
    throw new Error(
      'Drug interaction warning: ' + medication +
      ' interacts with: ' + interactions.join(', ')
    );
  }

  var prescription: Prescription = {
    id: generateId('rx'),
    patientId,
    doctorId,
    appointmentId,
    medication: medication.toLowerCase(),
    dosage,
    frequency,
    startDate,
    endDate,
    refills,
    notes,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  prescriptions.push(prescription);
  return prescription;
}

export function getPrescription(prescriptionId: string): Prescription | undefined {
  return prescriptions.find(p => p.id === prescriptionId);
}

export function getPatientPrescriptions(patientId: string): Prescription[] {
  return prescriptions.filter(p => p.patientId === patientId);
}

export function getActivePrescriptions(patientId: string): Prescription[] {
  var today = new Date().toISOString().split('T')[0];
  return prescriptions.filter(p =>
    p.patientId === patientId &&
    p.status === 'active' &&
    p.endDate >= today
  );
}

export function cancelPrescription(prescriptionId: string, reason?: string): Prescription {
  var prescription = prescriptions.find(p => p.id === prescriptionId);
  if (!prescription) {
    throw new Error('Prescription not found: ' + prescriptionId);
  }

  if (prescription.status === 'cancelled') {
    throw new Error('Prescription already cancelled');
  }

  prescription.status = 'cancelled';
  if (reason) {
    prescription.notes = (prescription.notes ? prescription.notes + '; ' : '') + 'Cancelled: ' + reason;
  }

  return prescription;
}

export function renewPrescription(prescriptionId: string, newEndDate: string, additionalRefills: number = 0): Prescription {
  var original = prescriptions.find(p => p.id === prescriptionId);
  if (!original) {
    throw new Error('Prescription not found: ' + prescriptionId);
  }

  var renewed = createPrescription(
    original.patientId,
    original.doctorId,
    original.medication,
    original.dosage,
    original.frequency,
    new Date().toISOString().split('T')[0],
    newEndDate,
    original.refills + additionalRefills,
    original.appointmentId,
    'Renewed from: ' + prescriptionId
  );

  original.status = 'completed';
  return renewed;
}

export function checkInteractions(patientId: string, newMedication: string): string[] {
  var activeMeds = getActivePrescriptions(patientId);
  var interactions: string[] = [];
  var medLower = newMedication.toLowerCase();

  var knownInteractions = drugInteractions[medLower] || [];

  for (var prescription of activeMeds) {
    if (knownInteractions.includes(prescription.medication)) {
      interactions.push(prescription.medication);
    }
  }

  return interactions;
}

export function getDoctorPrescriptions(doctorId: string): Prescription[] {
  return prescriptions.filter(p => p.doctorId === doctorId);
}

// Get prescriptions expiring within N days
export function getExpiringPrescriptions(days: number = 7): Prescription[] {
  var today = new Date();
  var cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  var cutoffStr = cutoff.toISOString().split('T')[0];
  var todayStr = today.toISOString().split('T')[0];

  return prescriptions.filter(function(p) {
    return p.status === 'active' &&
      p.endDate >= todayStr &&
      p.endDate <= cutoffStr;
  });
}

// Reset for testing
export function _resetPrescriptionData(): void {
  prescriptions = [];
}
