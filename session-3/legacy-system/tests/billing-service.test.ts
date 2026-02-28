// Billing Service tests - 60% coverage, missing edge cases

import {
  createInvoice, getInvoice, getPatientInvoices,
  markAsPaid, cancelInvoice,
  _resetBillingData
} from '../src/billing-service';
import { Appointment } from '../src/models';

beforeEach(() => {
  _resetBillingData();
});

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt1',
    patientId: 'pat1',
    doctorId: 'doc1',
    date: '2025-03-15',
    time: '10:00',
    duration: 30,
    type: 'consultation',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

describe('createInvoice', () => {
  it('should create an invoice for a consultation', () => {
    const invoice = createInvoice(makeAppointment());
    expect(invoice.id).toMatch(/^inv_/);
    expect(invoice.appointmentId).toBe('apt1');
    expect(invoice.patientId).toBe('pat1');
    expect(invoice.status).toBe('pending');
    expect(invoice.amount).toBeGreaterThan(0);
    expect(invoice.total).toBeGreaterThan(invoice.amount); // includes tax
  });

  it('should apply insurance discount', () => {
    const noInsurance = createInvoice(makeAppointment({ id: 'a1' }));
    const withInsurance = createInvoice(makeAppointment({ id: 'a2' }), 'BlueCross');

    expect(withInsurance.total).toBeLessThan(noInsurance.total);
    expect(withInsurance.insuranceClaim).toBeDefined();
    expect(withInsurance.insuranceClaim.provider).toBe('BlueCross');
  });

  it('should throw for invalid appointment', () => {
    expect(() => createInvoice(null as any)).toThrow('Valid appointment required');
  });

  // NOTE: missing tests for:
  // - different appointment type rates (followup, emergency, checkup, specialist)
  // - duration surcharge
  // - unknown appointment type (default rate)
  // - different insurance providers
  // - duration exactly 30 minutes (boundary)
});

describe('markAsPaid', () => {
  it('should mark a pending invoice as paid', () => {
    const invoice = createInvoice(makeAppointment());
    const paid = markAsPaid(invoice.id);
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeDefined();
  });

  it('should throw for already paid invoice', () => {
    const invoice = createInvoice(makeAppointment());
    markAsPaid(invoice.id);
    expect(() => markAsPaid(invoice.id)).toThrow('already paid');
  });

  it('should throw for unknown invoice', () => {
    expect(() => markAsPaid('unknown')).toThrow('Invoice not found');
  });

  // NOTE: missing test for paying a cancelled invoice
});

describe('getInvoice / getPatientInvoices', () => {
  it('should retrieve invoice by id', () => {
    const invoice = createInvoice(makeAppointment());
    const found = getInvoice(invoice.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(invoice.id);
  });

  it('should get invoices by patient', () => {
    createInvoice(makeAppointment({ id: 'a1', patientId: 'pat1' }));
    createInvoice(makeAppointment({ id: 'a2', patientId: 'pat1' }));
    createInvoice(makeAppointment({ id: 'a3', patientId: 'pat2' }));

    expect(getPatientInvoices('pat1')).toHaveLength(2);
    expect(getPatientInvoices('pat2')).toHaveLength(1);
  });
});

describe('cancelInvoice', () => {
  it('should cancel an invoice', () => {
    const invoice = createInvoice(makeAppointment());
    const cancelled = cancelInvoice(invoice.id);
    expect(cancelled.status).toBe('cancelled');
  });
});

// NOTE: missing tests for:
// - getPatientInvoices
// - getInvoiceByAppointment
// - getRevenue / getPendingAmount
// - createPaymentPlan
// - getInvoiceAgingReport
// - applyManualDiscount
// - _markOverdueInvoices
