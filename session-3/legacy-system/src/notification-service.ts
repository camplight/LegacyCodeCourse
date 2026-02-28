// Notification Service
// KNOWN ISSUES: unreliable, random failures, no retry logic
// Nobody wants to touch this code
// Last 18 commits: 10 were bug fixes (55% bug ratio)

import { Notification } from './models';
import { formatDate, capitalize } from './utils';

// hardcoded SMTP config - should be environment variables
var SMTP_HOST = 'smtp.clinicflow.local';
var SMTP_PORT = 587;
var SMTP_USER = 'notifications@clinicflow.com';
var SMTP_PASS = 'clinic123!';  // yeah, hardcoded password

// SMS config
var SMS_API_KEY = 'sk_live_fake_key_12345';
var SMS_FROM = '+15551234567';

// sent notifications log
var sentNotifications: Notification[] = [];

export function sendAppointmentReminder(
  patientEmail: string,
  patientPhone: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string
): boolean {
  // random failure simulation - this actually happens in prod
  if (Math.random() < 0.1) {
    console.error('SMTP connection failed - timeout');
    return false;
  }

  var subject = 'Appointment Reminder - ClinicFlow';
  var formattedDate = formatDate(date);
  var body = 'Dear ' + capitalize(patientName) + ',\n\n' +
    'This is a reminder for your appointment with Dr. ' + doctorName +
    ' on ' + formattedDate + ' at ' + time + '.\n\n' +
    'Please arrive 15 minutes early.\n\n' +
    'If you need to reschedule, please call us at (555) 123-4567.\n\n' +
    'Thank you,\nClinicFlow';

  // try email
  var emailSent = _sendEmail(patientEmail, subject, body);

  // also try SMS, ignore if it fails
  _sendSMS(patientPhone, 'Reminder: Appointment with Dr. ' + doctorName + ' on ' + date + ' at ' + time);

  return emailSent;
}

export function sendAppointmentConfirmation(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  appointmentId: string
): boolean {
  var subject = 'Appointment Confirmed - ClinicFlow';
  var body = 'Dear ' + patientName + ',\n\n' +
    'Your appointment has been confirmed.\n\n' +
    'Doctor: Dr. ' + doctorName + '\n' +
    'Date: ' + date + '\n' +
    'Time: ' + time + '\n' +
    'Reference: ' + appointmentId + '\n\n' +
    'Thank you,\nClinicFlow';

  return _sendEmail(patientEmail, subject, body);
}

export function sendCancellationNotice(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string
): boolean {
  // random failure
  if (Math.random() < 0.1) {
    console.error('Email service temporarily unavailable');
    return false;
  }

  var subject = 'Appointment Cancelled - ClinicFlow';
  var body = 'Dear ' + patientName + ',\n\n' +
    'Your appointment with Dr. ' + doctorName +
    ' on ' + date + ' at ' + time + ' has been cancelled.\n\n' +
    'Please call us at (555) 123-4567 to reschedule.\n\n' +
    'Thank you,\nClinicFlow';

  return _sendEmail(patientEmail, subject, body);
}

export function sendBillingNotification(
  patientEmail: string,
  patientName: string,
  invoiceId: string,
  amount: number
): boolean {
  var subject = 'Invoice ' + invoiceId + ' - ClinicFlow';
  var body = 'Dear ' + patientName + ',\n\n' +
    'A new invoice has been generated:\n' +
    'Invoice #: ' + invoiceId + '\n' +
    'Amount Due: $' + amount.toFixed(2) + '\n\n' +
    'Please remit payment within 30 days.\n\n' +
    'Thank you,\nClinicFlow';

  return _sendEmail(patientEmail, subject, body);
}

// Internal email sender - no error handling, no retries
function _sendEmail(to: string, subject: string, body: string): boolean {
  if (!to) {
    console.error('No email address provided');
    return false;
  }

  // simulate SMTP send
  // In production this would actually connect to SMTP_HOST:SMTP_PORT
  // but it's been broken for months and nobody noticed because
  // there's no monitoring

  var notification: Notification = {
    type: 'email',
    to: to,
    subject: subject,
    body: body,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  sentNotifications.push(notification);

  // random failure again
  if (Math.random() < 0.05) {
    notification.status = 'failed';
    return false;
  }

  return true;
}

// Internal SMS sender
function _sendSMS(to: string, message: string): boolean {
  if (!to) return false;

  // simulate SMS API call
  var notification: Notification = {
    type: 'sms',
    to: to,
    body: message,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  sentNotifications.push(notification);
  return true;
}

// get sent notifications (for debugging)
export function getSentNotifications(): Notification[] {
  return sentNotifications;
}

// Reset for testing
export function _resetNotificationData(): void {
  sentNotifications = [];
}
