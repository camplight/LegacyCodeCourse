// Reporting module
// Generates daily reports, appointment stats, revenue summaries
// PROBLEM: imports from EVERY other module directly
// PROBLEM: reaches into internal data structures
// PROBLEM: impossible to test in isolation

import { DailyReport } from './models';
import { getAllAppointments, getAppointmentsByDate } from './appointment-scheduler';
import { getAllPatients, getPatientsByStatus } from './patient-registry';
import { getRevenue, getPendingAmount, getPatientInvoices } from './billing-service';
import { getAllDoctors } from './doctor-schedule';
import { getActivePrescriptions, getPatientPrescriptions } from './prescription-manager';
import { getSentNotifications } from './notification-service';

export function generateDailyReport(date: string): DailyReport {
  var dayAppointments = getAppointmentsByDate(date);
  var allAppointments = getAllAppointments();

  // count statuses - messy nested logic
  var completed = 0;
  var cancelled = 0;
  var noShows = 0;
  var scheduled = 0;

  for (var i = 0; i < allAppointments.length; i++) {
    var apt = allAppointments[i];
    if (apt.date === date) {
      if (apt.status === 'completed') {
        completed++;
      } else if (apt.status === 'cancelled') {
        cancelled++;
      } else if (apt.status === 'no-show') {
        noShows++;
      } else if (apt.status === 'scheduled') {
        scheduled++;
      }
    }
  }

  var totalForDay = completed + cancelled + noShows + scheduled;

  // count new patients created today
  var allPatients = getAllPatients();
  var newPatients = 0;
  for (var j = 0; j < allPatients.length; j++) {
    if (allPatients[j].createdAt && allPatients[j].createdAt.startsWith(date)) {
      newPatients++;
    }
  }

  // count prescriptions - have to check all patients
  var prescriptionsWritten = 0;
  for (var k = 0; k < allPatients.length; k++) {
    var patientRx = getPatientPrescriptions(allPatients[k].id);
    for (var l = 0; l < patientRx.length; l++) {
      if (patientRx[l].createdAt && patientRx[l].createdAt.startsWith(date)) {
        prescriptionsWritten++;
      }
    }
  }

  // get revenue
  var revenue = getRevenue(date, date + 'T23:59:59');

  return {
    date: date,
    totalAppointments: totalForDay,
    completedAppointments: completed,
    cancelledAppointments: cancelled,
    noShows: noShows,
    revenue: revenue,
    newPatients: newPatients,
    prescriptionsWritten: prescriptionsWritten
  };
}

export function generateAppointmentStats(): any {
  var allAppointments = getAllAppointments();
  var doctors = getAllDoctors();

  var stats: any = {
    total: allAppointments.length,
    byStatus: {} as any,
    byType: {} as any,
    byDoctor: {} as any,
    averageDuration: 0
  };

  var totalDuration = 0;

  for (var i = 0; i < allAppointments.length; i++) {
    var apt = allAppointments[i];

    // count by status
    if (!stats.byStatus[apt.status]) {
      stats.byStatus[apt.status] = 0;
    }
    stats.byStatus[apt.status]++;

    // count by type
    if (!stats.byType[apt.type]) {
      stats.byType[apt.type] = 0;
    }
    stats.byType[apt.type]++;

    // count by doctor
    if (!stats.byDoctor[apt.doctorId]) {
      var doc = doctors.find(function(d) { return d.id === apt.doctorId; });
      stats.byDoctor[apt.doctorId] = {
        name: doc ? doc.name : 'Unknown',
        count: 0
      };
    }
    stats.byDoctor[apt.doctorId].count++;

    totalDuration += apt.duration;
  }

  if (allAppointments.length > 0) {
    stats.averageDuration = Math.round(totalDuration / allAppointments.length);
  }

  return stats;
}

export function generateRevenueReport(): any {
  var allPatients = getAllPatients();
  var totalRevenue = getRevenue();
  var pendingAmount = getPendingAmount();

  // per-patient revenue breakdown
  var patientRevenue: any[] = [];
  for (var i = 0; i < allPatients.length; i++) {
    var invoices = getPatientInvoices(allPatients[i].id);
    var patientTotal = 0;
    var patientPaid = 0;
    var patientPending = 0;

    for (var j = 0; j < invoices.length; j++) {
      if (invoices[j].status === 'paid') {
        patientPaid += invoices[j].total;
      } else if (invoices[j].status === 'pending') {
        patientPending += invoices[j].total;
      }
      patientTotal += invoices[j].total;
    }

    if (patientTotal > 0) {
      patientRevenue.push({
        patientId: allPatients[i].id,
        patientName: allPatients[i].name,
        total: Math.round(patientTotal * 100) / 100,
        paid: Math.round(patientPaid * 100) / 100,
        pending: Math.round(patientPending * 100) / 100
      });
    }
  }

  return {
    totalRevenue: totalRevenue,
    pendingAmount: pendingAmount,
    patientBreakdown: patientRevenue
  };
}

export function generateNotificationReport(): any {
  var notifications = getSentNotifications();

  var emailCount = 0;
  var smsCount = 0;
  var failedCount = 0;

  for (var i = 0; i < notifications.length; i++) {
    if (notifications[i].type === 'email') {
      emailCount++;
    } else if (notifications[i].type === 'sms') {
      smsCount++;
    }
    if (notifications[i].status === 'failed') {
      failedCount++;
    }
  }

  return {
    total: notifications.length,
    emails: emailCount,
    sms: smsCount,
    failed: failedCount,
    successRate: notifications.length > 0
      ? Math.round(((notifications.length - failedCount) / notifications.length) * 100)
      : 100
  };
}

export function generateSystemOverview(): any {
  var patients = getAllPatients();
  var doctors = getAllDoctors();
  var appointments = getAllAppointments();
  var notifications = getSentNotifications();

  return {
    patients: {
      total: patients.length,
      active: getPatientsByStatus('active').length,
      inactive: getPatientsByStatus('inactive').length
    },
    doctors: {
      total: doctors.length
    },
    appointments: {
      total: appointments.length,
      scheduled: appointments.filter(function(a) { return a.status === 'scheduled'; }).length,
      completed: appointments.filter(function(a) { return a.status === 'completed'; }).length,
      cancelled: appointments.filter(function(a) { return a.status === 'cancelled'; }).length
    },
    notifications: {
      total: notifications.length,
      failed: notifications.filter(function(n) { return n.status === 'failed'; }).length
    },
    revenue: {
      collected: getRevenue(),
      pending: getPendingAmount()
    }
  };
}
