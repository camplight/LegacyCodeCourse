// ClinicFlow API Server
// All routes defined here - it's a monolith

import express from 'express';
import {
  scheduleAppointment, rescheduleAppointment, cancelAppointment,
  getAppointment, getAppointmentsByDate, getAppointmentsByDoctor,
  getAppointmentsByPatient, completeAppointment, markNoShow
} from './appointment-scheduler';
import {
  registerPatient, getPatient, getAllPatients,
  updatePatient, searchPatients, addMedicalHistory,
  deactivatePatient
} from './patient-registry';
import {
  addDoctor, getDoctor, getAllDoctors, getDoctorsBySpecialty,
  setSchedule, getWeekSchedule, getAvailableSlots
} from './doctor-schedule';
import {
  createInvoice, getInvoice, getPatientInvoices,
  markAsPaid, cancelInvoice
} from './billing-service';
import {
  createPrescription, getPrescription, getPatientPrescriptions,
  getActivePrescriptions, cancelPrescription, renewPrescription,
  checkInteractions
} from './prescription-manager';
import {
  generateDailyReport, generateAppointmentStats,
  generateRevenueReport, generateNotificationReport,
  generateSystemOverview
} from './reporting';

var app = express();
app.use(express.json());

// ===== PATIENT ROUTES =====

app.post('/api/patients', function(req, res) {
  try {
    var patient = registerPatient(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/patients', function(req, res) {
  try {
    if (req.query.search) {
      var results = searchPatients(req.query.search as string);
      res.json({ success: true, data: results });
    } else {
      res.json({ success: true, data: getAllPatients() });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/patients/:id', function(req, res) {
  var patient = getPatient(req.params.id);
  if (!patient) {
    res.status(404).json({ success: false, error: 'Patient not found' });
    return;
  }
  res.json({ success: true, data: patient });
});

app.put('/api/patients/:id', function(req, res) {
  try {
    var updated = updatePatient(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/patients/:id/medical-history', function(req, res) {
  try {
    var patient = addMedicalHistory(req.params.id, req.body);
    res.json({ success: true, data: patient });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/patients/:id', function(req, res) {
  try {
    var patient = deactivatePatient(req.params.id);
    res.json({ success: true, data: patient });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== DOCTOR ROUTES =====

app.post('/api/doctors', function(req, res) {
  try {
    var doctor = addDoctor(req.body);
    res.status(201).json({ success: true, data: doctor });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/doctors', function(req, res) {
  if (req.query.specialty) {
    res.json({ success: true, data: getDoctorsBySpecialty(req.query.specialty as string) });
  } else {
    res.json({ success: true, data: getAllDoctors() });
  }
});

app.get('/api/doctors/:id', function(req, res) {
  var doctor = getDoctor(req.params.id);
  if (!doctor) {
    res.status(404).json({ success: false, error: 'Doctor not found' });
    return;
  }
  res.json({ success: true, data: doctor });
});

app.post('/api/doctors/:id/schedule', function(req, res) {
  try {
    var schedule = setSchedule(
      req.params.id,
      req.body.dayOfWeek,
      req.body.workingHours,
      req.body.breaks
    );
    res.json({ success: true, data: schedule });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/doctors/:id/schedule', function(req, res) {
  var schedule = getWeekSchedule(req.params.id);
  res.json({ success: true, data: schedule });
});

app.get('/api/doctors/:id/available-slots', function(req, res) {
  if (!req.query.date) {
    res.status(400).json({ success: false, error: 'Date parameter required' });
    return;
  }
  var duration = req.query.duration ? parseInt(req.query.duration as string) : 30;
  var slots = getAvailableSlots(req.params.id, req.query.date as string, duration);
  res.json({ success: true, data: slots });
});

// ===== APPOINTMENT ROUTES =====

app.post('/api/appointments', function(req, res) {
  try {
    var appointment = scheduleAppointment(
      req.body.patientId,
      req.body.doctorId,
      req.body.date,
      req.body.time,
      req.body.type,
      req.body.duration,
      req.body.notes
    );
    res.status(201).json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/appointments/:id', function(req, res) {
  var appointment = getAppointment(req.params.id);
  if (!appointment) {
    res.status(404).json({ success: false, error: 'Appointment not found' });
    return;
  }
  res.json({ success: true, data: appointment });
});

app.get('/api/appointments', function(req, res) {
  try {
    if (req.query.date) {
      res.json({ success: true, data: getAppointmentsByDate(req.query.date as string) });
    } else if (req.query.doctorId) {
      res.json({ success: true, data: getAppointmentsByDoctor(req.query.doctorId as string, req.query.date as string) });
    } else if (req.query.patientId) {
      res.json({ success: true, data: getAppointmentsByPatient(req.query.patientId as string) });
    } else {
      res.status(400).json({ success: false, error: 'Query parameter required: date, doctorId, or patientId' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/appointments/:id/reschedule', function(req, res) {
  try {
    var appointment = rescheduleAppointment(
      req.params.id,
      req.body.date,
      req.body.time
    );
    res.json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/appointments/:id/cancel', function(req, res) {
  try {
    var appointment = cancelAppointment(req.params.id, req.body.reason);
    res.json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/appointments/:id/complete', function(req, res) {
  try {
    var appointment = completeAppointment(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/appointments/:id/no-show', function(req, res) {
  try {
    var appointment = markNoShow(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== BILLING ROUTES =====

app.get('/api/billing/invoices/:id', function(req, res) {
  var invoice = getInvoice(req.params.id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: invoice });
});

app.get('/api/billing/patients/:patientId/invoices', function(req, res) {
  var invoices = getPatientInvoices(req.params.patientId);
  res.json({ success: true, data: invoices });
});

app.put('/api/billing/invoices/:id/pay', function(req, res) {
  try {
    var invoice = markAsPaid(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/billing/invoices/:id/cancel', function(req, res) {
  try {
    var invoice = cancelInvoice(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===== PRESCRIPTION ROUTES =====

app.post('/api/prescriptions', function(req, res) {
  try {
    var prescription = createPrescription(
      req.body.patientId,
      req.body.doctorId,
      req.body.medication,
      req.body.dosage,
      req.body.frequency,
      req.body.startDate,
      req.body.endDate,
      req.body.refills,
      req.body.appointmentId,
      req.body.notes
    );
    res.status(201).json({ success: true, data: prescription });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/prescriptions/:id', function(req, res) {
  var prescription = getPrescription(req.params.id);
  if (!prescription) {
    res.status(404).json({ success: false, error: 'Prescription not found' });
    return;
  }
  res.json({ success: true, data: prescription });
});

app.get('/api/patients/:patientId/prescriptions', function(req, res) {
  if (req.query.active === 'true') {
    res.json({ success: true, data: getActivePrescriptions(req.params.patientId) });
  } else {
    res.json({ success: true, data: getPatientPrescriptions(req.params.patientId) });
  }
});

app.put('/api/prescriptions/:id/cancel', function(req, res) {
  try {
    var prescription = cancelPrescription(req.params.id, req.body.reason);
    res.json({ success: true, data: prescription });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/prescriptions/:id/renew', function(req, res) {
  try {
    var prescription = renewPrescription(
      req.params.id,
      req.body.newEndDate,
      req.body.additionalRefills
    );
    res.json({ success: true, data: prescription });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/prescriptions/check-interactions', function(req, res) {
  if (!req.query.patientId || !req.query.medication) {
    res.status(400).json({ success: false, error: 'patientId and medication required' });
    return;
  }
  var interactions = checkInteractions(
    req.query.patientId as string,
    req.query.medication as string
  );
  res.json({ success: true, data: { interactions, hasInteractions: interactions.length > 0 } });
});

// ===== REPORTING ROUTES =====

app.get('/api/reports/daily', function(req, res) {
  if (!req.query.date) {
    res.status(400).json({ success: false, error: 'Date parameter required' });
    return;
  }
  try {
    var report = generateDailyReport(req.query.date as string);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports/appointments', function(req, res) {
  try {
    var stats = generateAppointmentStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports/revenue', function(req, res) {
  try {
    var report = generateRevenueReport();
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports/notifications', function(req, res) {
  try {
    var report = generateNotificationReport();
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports/overview', function(req, res) {
  try {
    var overview = generateSystemOverview();
    res.json({ success: true, data: overview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== HEALTH CHECK =====

app.get('/api/health', function(_req, res) {
  res.json({ status: 'ok', service: 'ClinicFlow', version: '1.0.0' });
});

// Export app for testing with supertest
export { app };

// Start server if run directly
var PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, function() {
    console.log('ClinicFlow API running on port ' + PORT);
  });
}
