// ClinicFlow - Data models
// TODO: clean up these types at some point
// Last updated: unknown

export interface Patient {
  id: string;
  name: string;  // full name, no first/last split
  email: string;
  phone: string;
  dateOfBirth: string;   // sometimes ISO, sometimes MM/DD/YYYY
  medicalHistory: any[];  // array of... something
  insuranceProvider?: string;
  insuranceId?: string;
  address: any;   // could be string or object
  createdAt: string;
  notes?: string;
  status: string;  // 'active' | 'inactive' | anything really
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  workingHours: any;  // varies by who coded it
  breaks?: any[];
  active: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM (24h)
  duration: number;     // minutes
  type: string;         // checkup, followup, emergency, consultation...
  status: string;       // scheduled, completed, cancelled, no-show
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  billingId?: string;
  // added later, not always present
  reminderSent?: boolean;
  cancelReason?: any;
}

// used for billing, but also sometimes for appointments
export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  tax: number;
  total: number;
  status: string;      // pending, paid, overdue, cancelled
  insuranceClaim?: any;
  createdAt: string;
  paidAt?: string;
  items: any[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  refills: number;
  notes?: string;
  createdAt: string;
  status: string;   // active, completed, cancelled
}

// notification types - added as afterthought
export interface Notification {
  id?: string;
  type: string;    // email, sms
  to: string;
  subject?: string;
  body: string;
  status?: string;
  sentAt?: string;
}

// report types - messy
export interface DailyReport {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShows: number;
  revenue: number;
  newPatients: number;
  prescriptionsWritten: number;
  data?: any;
}

// generic response wrapper - used inconsistently
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
