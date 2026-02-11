// Tests for Sprout Classes Pattern
// Demonstrates that the new class is independently testable

import { TaxCalculator } from './after';

describe('TaxCalculator (Sprout Class)', () => {
  let calculator: TaxCalculator;

  beforeEach(() => {
    calculator = new TaxCalculator();
  });

  describe('UK VAT Calculation', () => {
    it('should calculate 20% VAT for UK orders', () => {
      const order = {
        id: 'INV-001',
        customer: {
          id: 'CUST-123',
          name: 'Test Customer',
          email: 'test@example.com',
          address: 'London, UK',
          country: 'UK'
        },
        items: [
          { name: 'Item 1', price: 100, quantity: 1 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(20);
      expect(tax.amount).toBe(20);
      expect(tax.type).toBe('VAT');
      expect(tax.country).toBe('UK');
    });

    it('should exclude tax-exempt items from UK VAT', () => {
      const order = {
        id: 'INV-002',
        customer: {
          id: 'CUST-123',
          name: 'Test Customer',
          email: 'test@example.com',
          address: 'London, UK',
          country: 'UK'
        },
        items: [
          { name: 'Taxable Item', price: 100, quantity: 1 },
          { name: 'Tax-Exempt Item', price: 50, quantity: 1, taxExempt: true }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      // Only £100 is taxable, not £150
      expect(tax.amount).toBe(20); // 20% of £100
    });
  });

  describe('EU VAT Calculation', () => {
    it('should calculate 19% VAT for German orders', () => {
      const order = {
        id: 'INV-003',
        customer: {
          id: 'CUST-456',
          name: 'German Customer',
          email: 'test@example.de',
          address: 'Berlin, Germany',
          country: 'DE'
        },
        items: [
          { name: 'Item', price: 100, quantity: 1 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(19);
      expect(tax.amount).toBe(19);
      expect(tax.type).toBe('VAT');
    });

    it('should calculate 22% VAT for Italian orders', () => {
      const order = {
        id: 'INV-004',
        customer: {
          id: 'CUST-789',
          name: 'Italian Customer',
          email: 'test@example.it',
          address: 'Rome, Italy',
          country: 'IT'
        },
        items: [
          { name: 'Item', price: 200, quantity: 2 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(22);
      expect(tax.amount).toBe(88); // 22% of £400
    });
  });

  describe('US Sales Tax Calculation', () => {
    it('should calculate California sales tax', () => {
      const order = {
        id: 'INV-005',
        customer: {
          id: 'CUST-001',
          name: 'California Customer',
          email: 'test@example.com',
          address: '123 Main St, CA 90210',
          country: 'US'
        },
        items: [
          { name: 'Item', price: 100, quantity: 1 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(7.25);
      expect(tax.amount).toBeCloseTo(7.25, 2);
      expect(tax.type).toBe('Sales Tax');
    });

    it('should calculate New York sales tax', () => {
      const order = {
        id: 'INV-006',
        customer: {
          id: 'CUST-002',
          name: 'New York Customer',
          email: 'test@example.com',
          address: '456 Broadway, NY 10001',
          country: 'US'
        },
        items: [
          { name: 'Item', price: 100, quantity: 1 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(4.0);
      expect(tax.amount).toBe(4.0);
    });
  });

  describe('Edge Cases', () => {
    it('should return zero tax for unknown countries', () => {
      const order = {
        id: 'INV-007',
        customer: {
          id: 'CUST-999',
          name: 'Unknown Customer',
          email: 'test@example.com',
          address: 'Some Address',
          country: 'XX'
        },
        items: [
          { name: 'Item', price: 100, quantity: 1 }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      expect(tax.rate).toBe(0);
      expect(tax.amount).toBe(0);
      expect(tax.type).toBe('None');
    });

    it('should handle multiple tax-exempt items', () => {
      const order = {
        id: 'INV-008',
        customer: {
          id: 'CUST-123',
          name: 'Test Customer',
          email: 'test@example.com',
          address: 'London, UK',
          country: 'UK'
        },
        items: [
          { name: 'Taxable 1', price: 50, quantity: 1 },
          { name: 'Exempt 1', price: 100, quantity: 1, taxExempt: true },
          { name: 'Taxable 2', price: 50, quantity: 1 },
          { name: 'Exempt 2', price: 100, quantity: 1, taxExempt: true }
        ],
        date: new Date()
      };

      const tax = calculator.calculateTax(order);

      // Only £100 total is taxable (2 x £50)
      expect(tax.amount).toBe(20); // 20% of £100
    });
  });
});
