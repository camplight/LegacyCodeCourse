// Tests for pricing engine
// Coverage: ~70% - some edge cases missing

import { calculatePrice, getTaxRate, applyPromotions, getCustomerTierDiscount } from '../src/pricing-engine';
import { Order, Customer } from '../src/models';

describe('Pricing Engine', () => {
  describe('calculatePrice', () => {
    it('should calculate basic price without customer', () => {
      const order: Order = {
        id: 'ORD001',
        customerId: 'CUST001',
        items: [
          { productId: 'P1', productName: 'Item 1', quantity: 2, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const result = calculatePrice(order);

      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(10); // 10% default
      expect(result.shipping).toBe(9.99);
      expect(result.total).toBe(119.99);
    });

    it('should calculate price with premium customer', () => {
      const order: Order = {
        id: 'ORD002',
        customerId: 'CUST002',
        items: [
          { productId: 'P1', productName: 'Item 1', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const customer: Customer = {
        id: 'CUST002',
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium',
        country: 'US'
      };

      const result = calculatePrice(order, customer);

      expect(result.subtotal).toBe(50);
      expect(result.tax).toBe(4); // 8% US tax
      expect(result.shipping).toBe(0); // Free for premium
      expect(result.total).toBe(54);
    });

    it('should give free shipping for orders over $100', () => {
      const order: Order = {
        id: 'ORD003',
        customerId: 'CUST003',
        items: [
          { productId: 'P1', productName: 'Item 1', quantity: 3, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const result = calculatePrice(order);

      expect(result.subtotal).toBe(150);
      expect(result.shipping).toBe(0); // Free over $100
    });
  });

  describe('getTaxRate', () => {
    it('should return default tax rate without customer', () => {
      const rate = getTaxRate();
      expect(rate).toBe(0.1);
    });

    it('should return US tax rate', () => {
      const customer: Customer = {
        id: 'CUST001',
        email: 'us@example.com',
        name: 'US User',
        tier: 'standard',
        country: 'US'
      };

      const rate = getTaxRate(customer);
      expect(rate).toBe(0.08);
    });

    it('should return UK VAT rate', () => {
      const customer: Customer = {
        id: 'CUST002',
        email: 'uk@example.com',
        name: 'UK User',
        tier: 'standard',
        country: 'UK'
      };

      const rate = getTaxRate(customer);
      expect(rate).toBe(0.2);
    });

    it('should return Canada tax rate', () => {
      const customer: Customer = {
        id: 'CUST003',
        email: 'ca@example.com',
        name: 'CA User',
        tier: 'standard',
        country: 'CA'
      };

      const rate = getTaxRate(customer);
      expect(rate).toBe(0.13);
    });
  });

  describe('applyPromotions', () => {
    it('should apply SAVE10 promotion', () => {
      const pricing = {
        subtotal: 100,
        tax: 10,
        shipping: 9.99,
        total: 119.99
      };

      const result = applyPromotions(pricing, 'SAVE10');

      expect(result.subtotal).toBe(90); // 10% off
      expect(result.total).toBeLessThan(pricing.total);
    });

    it('should apply FLAT15 promotion', () => {
      const pricing = {
        subtotal: 100,
        tax: 10,
        shipping: 9.99,
        total: 119.99
      };

      const result = applyPromotions(pricing, 'FLAT15');

      expect(result.subtotal).toBe(85); // $15 off
    });
  });

  describe('getCustomerTierDiscount', () => {
    it('should return VIP discount', () => {
      const customer: Customer = {
        id: 'VIP001',
        email: 'vip@example.com',
        name: 'VIP User',
        tier: 'vip'
      };

      const discount = getCustomerTierDiscount(customer);
      expect(discount).toBe(0.15);
    });

    it('should return premium discount', () => {
      const customer: Customer = {
        id: 'PREM001',
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium'
      };

      const discount = getCustomerTierDiscount(customer);
      expect(discount).toBe(0.1);
    });

    it('should return no discount for standard tier', () => {
      const customer: Customer = {
        id: 'STD001',
        email: 'standard@example.com',
        name: 'Standard User',
        tier: 'standard'
      };

      const discount = getCustomerTierDiscount(customer);
      expect(discount).toBe(0);
    });
  });

  // NOTE: Missing tests for:
  // - Edge cases in shipping calculation (different countries)
  // - SAVE20 and PREMIUM50 promo codes
  // - Tax calculation for AU, DE, FR, IT
  // - International shipping rates
  // This gives us ~70% coverage
});
