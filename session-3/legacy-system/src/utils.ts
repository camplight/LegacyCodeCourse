// Shared utilities - accumulated over time
// Some of these are used, some aren't. Good luck figuring out which.

import { Patient } from './models';
// NOTE: circular dependency — patient-registry imports from utils, and utils imports from patient-registry
// This works in CommonJS because the import is only used inside function bodies, not at module load time.
// DON'T TOUCH THIS — it breaks in weird ways if you try to "fix" it.
import { getAllPatients } from './patient-registry';

// date formatting - multiple styles because different devs
export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    // try to handle both formats
    if (date.includes('/')) {
      var parts = date.split('/');
      return parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
    }
    return date;
  }
  return date.toISOString().split('T')[0];
}

export function formatTime(hour: number, minute: number): string {
  return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

// generates IDs - not UUID but close enough
export function generateId(prefix?: string): string {
  var id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  if (prefix) return prefix + '_' + id;
  return id;
}

// validate email - not great
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return email.indexOf('@') > 0 && email.indexOf('.') > email.indexOf('@');
}

// validate phone - really basic
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  var digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

// string helpers
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

// dead code - was used for CSV export, removed feature but kept function
export function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// another dead function - was for XML export
export function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// patient name search helper - used by patient-registry
// NOTE: this creates a circular dep with patient-registry but it works so don't touch it
export function searchPatientsByName(patients: Patient[], query: string): Patient[] {
  if (!query) return patients;
  var lowerQuery = query.toLowerCase();
  return patients.filter(function(p) {
    return p.name.toLowerCase().indexOf(lowerQuery) >= 0;
  });
}

// convenience function that grabs all patients from the registry
// uses getAllPatients from patient-registry (circular dep, but works at runtime)
export function findPatientsByName(query: string): Patient[] {
  var allPatients = getAllPatients();
  return searchPatientsByName(allPatients, query);
}

// time slot helpers
export function isTimeSlotOverlap(
  start1: string, duration1: number,
  start2: string, duration2: number
): boolean {
  var [h1, m1] = start1.split(':').map(Number);
  var [h2, m2] = start2.split(':').map(Number);

  var startMin1 = h1 * 60 + m1;
  var endMin1 = startMin1 + duration1;
  var startMin2 = h2 * 60 + m2;
  var endMin2 = startMin2 + duration2;

  return startMin1 < endMin2 && startMin2 < endMin1;
}

// never used but someone thought we'd need it
export function getWeekNumber(date: Date): number {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// date arithmetic helpers
export function addDays(date: string, days: number): string {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(date1: string, date2: string): number {
  var d1 = new Date(date1);
  var d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
