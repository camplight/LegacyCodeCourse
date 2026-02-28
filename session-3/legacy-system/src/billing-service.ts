// Billing Service - invoice generation, payment tracking, insurance
// TODO: refactor magic numbers
// TODO: add proper insurance provider integration

import { Invoice, Appointment } from './models';
import { generateId } from './utils';

// In-memory storage
var invoices: Invoice[] = [];

// magic numbers for consultation rates
var CONSULTATION_RATE = 150;
var FOLLOWUP_RATE = 100;
var EMERGENCY_RATE = 300;
var CHECKUP_RATE = 120;
var SPECIALIST_RATE = 200;

// tax rate - hardcoded, should be configurable
var TAX_RATE = 0.08;

// insurance coverage rates - very simplified
var INSURANCE_COVERAGE: any = {
  'BlueCross': 0.80,
  'Aetna': 0.75,
  'UnitedHealth': 0.70,
  'Medicare': 0.90,
  'Medicaid': 0.95,
  'Cigna': 0.72,
  'default': 0.0
};

export function createInvoice(appointment: Appointment, insuranceProvider?: string): Invoice {
  if (!appointment || !appointment.id) {
    throw new Error('Valid appointment required');
  }

  // determine rate based on appointment type
  var baseRate = CONSULTATION_RATE; // default
  if (appointment.type === 'followup') {
    baseRate = FOLLOWUP_RATE;
  } else if (appointment.type === 'emergency') {
    baseRate = EMERGENCY_RATE;
  } else if (appointment.type === 'checkup') {
    baseRate = CHECKUP_RATE;
  } else if (appointment.type === 'specialist') {
    baseRate = SPECIALIST_RATE;
  }

  // calculate duration surcharge
  var durationSurcharge = 0;
  if (appointment.duration > 30) {
    // $25 per additional 15 min block
    durationSurcharge = Math.ceil((appointment.duration - 30) / 15) * 25;
  }

  var subtotal = baseRate + durationSurcharge;

  // apply insurance discount
  var insuranceDiscount = 0;
  if (insuranceProvider) {
    var coverageRate = INSURANCE_COVERAGE[insuranceProvider] || INSURANCE_COVERAGE['default'];
    insuranceDiscount = subtotal * coverageRate;
  }

  var amount = subtotal - insuranceDiscount;
  var tax = amount * TAX_RATE;
  var total = amount + tax;

  // build items list (for the invoice)
  var items: any[] = [
    { description: appointment.type + ' consultation', amount: baseRate }
  ];
  if (durationSurcharge > 0) {
    items.push({ description: 'Extended duration surcharge', amount: durationSurcharge });
  }
  if (insuranceDiscount > 0) {
    items.push({ description: 'Insurance discount (' + insuranceProvider + ')', amount: -insuranceDiscount });
  }
  items.push({ description: 'Tax (' + (TAX_RATE * 100) + '%)', amount: tax });

  var invoice: Invoice = {
    id: generateId('inv'),
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    amount: Math.round(amount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    status: 'pending',
    insuranceClaim: insuranceProvider ? {
      provider: insuranceProvider,
      coverageRate: INSURANCE_COVERAGE[insuranceProvider] || 0,
      discount: Math.round(insuranceDiscount * 100) / 100,
      status: 'submitted'
    } : undefined,
    createdAt: new Date().toISOString(),
    items
  };

  invoices.push(invoice);
  return invoice;
}

export function getInvoice(invoiceId: string): Invoice | undefined {
  return invoices.find(i => i.id === invoiceId);
}

export function getPatientInvoices(patientId: string): Invoice[] {
  return invoices.filter(i => i.patientId === patientId);
}

export function getInvoiceByAppointment(appointmentId: string): Invoice | undefined {
  return invoices.find(i => i.appointmentId === appointmentId);
}

export function markAsPaid(invoiceId: string): Invoice {
  var invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice already paid');
  }

  if (invoice.status === 'cancelled') {
    throw new Error('Cannot pay cancelled invoice');
  }

  invoice.status = 'paid';
  invoice.paidAt = new Date().toISOString();
  return invoice;
}

export function cancelInvoice(invoiceId: string): Invoice {
  var invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  invoice.status = 'cancelled';
  return invoice;
}

// dead code: was supposed to handle overdue invoices
export function _markOverdueInvoices(): number {
  var count = 0;
  var thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (var inv of invoices) {
    if (inv.status === 'pending' && new Date(inv.createdAt) < thirtyDaysAgo) {
      inv.status = 'overdue';
      count++;
    }
  }
  return count;
}

export function getRevenue(startDate?: string, endDate?: string): number {
  var total = 0;
  for (var inv of invoices) {
    if (inv.status === 'paid') {
      if (startDate && inv.paidAt && inv.paidAt < startDate) continue;
      if (endDate && inv.paidAt && inv.paidAt > endDate) continue;
      total += inv.total;
    }
  }
  return Math.round(total * 100) / 100;
}

export function getPendingAmount(): number {
  var total = 0;
  for (var inv of invoices) {
    if (inv.status === 'pending') {
      total += inv.total;
    }
  }
  return Math.round(total * 100) / 100;
}

// Generate a payment plan for large invoices
export function createPaymentPlan(invoiceId: string, installments: number): any {
  var invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'pending') {
    throw new Error('Can only create payment plan for pending invoices');
  }

  if (installments < 2 || installments > 12) {
    throw new Error('Installments must be between 2 and 12');
  }

  var installmentAmount = Math.round((invoice.total / installments) * 100) / 100;
  var remainder = Math.round((invoice.total - installmentAmount * installments) * 100) / 100;

  var plan: any[] = [];
  for (var i = 0; i < installments; i++) {
    var dueDate = new Date(invoice.createdAt);
    dueDate.setMonth(dueDate.getMonth() + i + 1);

    plan.push({
      installment: i + 1,
      amount: i === 0 ? installmentAmount + remainder : installmentAmount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending'
    });
  }

  return {
    invoiceId: invoice.id,
    totalAmount: invoice.total,
    installments: plan
  };
}

// Reset for testing
export function _resetBillingData(): void {
  invoices = [];
}
