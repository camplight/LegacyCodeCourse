// Tests for shipping calculator
// Good coverage of shipping logic

import { calculateShippingOptions, estimateDeliveryDate } from '../src/shipping-calculator';
import { Order, Customer } from '../src/models';

describe('Shipping Calculator', () => {
  describe('calculateShippingOptions', () => {
    it('should return all shipping options', () => {
      const order: Order = {
        id: 'ORD001',
        customerId: 'CUST001',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const options = calculateShippingOptions(order);

      expect(options).toHaveLength(3);
      expect(options[0].method).toBe('standard');
      expect(options[1].method).toBe('express');
      expect(options[2].method).toBe('overnight');
    });

    it('should give free standard shipping for orders over $100', () => {
      const order: Order = {
        id: 'ORD002',
        customerId: 'CUST002',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 3, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const options = calculateShippingOptions(order);

      const standard = options.find(o => o.method === 'standard');
      expect(standard?.cost).toBe(0);
    });

    it('should give free standard shipping for premium customers', () => {
      const order: Order = {
        id: 'ORD003',
        customerId: 'CUST003',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const customer: Customer = {
        id: 'CUST003',
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium'
      };

      const options = calculateShippingOptions(order, customer);

      const standard = options.find(o => o.method === 'standard');
      expect(standard?.cost).toBe(0);
    });

    it('should give free standard shipping for VIP customers', () => {
      const order: Order = {
        id: 'ORD004',
        customerId: 'CUST004',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const customer: Customer = {
        id: 'CUST004',
        email: 'vip@example.com',
        name: 'VIP User',
        tier: 'vip'
      };

      const options = calculateShippingOptions(order, customer);

      const standard = options.find(o => o.method === 'standard');
      expect(standard?.cost).toBe(0);
    });

    it('should discount express shipping for VIP customers', () => {
      const order: Order = {
        id: 'ORD005',
        customerId: 'CUST005',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const customer: Customer = {
        id: 'CUST005',
        email: 'vip@example.com',
        name: 'VIP User',
        tier: 'vip'
      };

      const options = calculateShippingOptions(order, customer);

      const express = options.find(o => o.method === 'express');
      expect(express?.cost).toBe(19.99 * 0.5); // 50% off
    });

    it('should discount overnight shipping for VIP customers', () => {
      const order: Order = {
        id: 'ORD006',
        customerId: 'CUST006',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const customer: Customer = {
        id: 'CUST006',
        email: 'vip@example.com',
        name: 'VIP User',
        tier: 'vip'
      };

      const options = calculateShippingOptions(order, customer);

      const overnight = options.find(o => o.method === 'overnight');
      expect(overnight?.cost).toBe(34.99 * 0.75); // 25% off
    });

    it('should set correct estimated days for each method', () => {
      const order: Order = {
        id: 'ORD007',
        customerId: 'CUST007',
        items: [
          { productId: 'P1', productName: 'Item', quantity: 1, unitPrice: 50 }
        ],
        status: 'pending',
        createdAt: new Date()
      };

      const options = calculateShippingOptions(order);

      expect(options[0].estimatedDays).toBe(5); // standard
      expect(options[1].estimatedDays).toBe(2); // express
      expect(options[2].estimatedDays).toBe(1); // overnight
    });
  });

  describe('estimateDeliveryDate', () => {
    it('should estimate delivery date for standard shipping', () => {
      const deliveryDate = estimateDeliveryDate('standard');
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(today.getDate() + 5);

      expect(deliveryDate.toDateString()).toBe(expected.toDateString());
    });

    it('should estimate delivery date for express shipping', () => {
      const deliveryDate = estimateDeliveryDate('express');
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(today.getDate() + 2);

      expect(deliveryDate.toDateString()).toBe(expected.toDateString());
    });

    it('should estimate delivery date for overnight shipping', () => {
      const deliveryDate = estimateDeliveryDate('overnight');
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(today.getDate() + 1);

      expect(deliveryDate.toDateString()).toBe(expected.toDateString());
    });

    it('should default to standard shipping for unknown method', () => {
      const deliveryDate = estimateDeliveryDate('unknown');
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(today.getDate() + 5);

      expect(deliveryDate.toDateString()).toBe(expected.toDateString());
    });
  });
});
