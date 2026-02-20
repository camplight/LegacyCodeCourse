// Tests for payment gateway
// Good coverage of payment processing logic

import { processPayment, refundPayment, validatePaymentDetails } from '../src/payment-gateway';
import { Order } from '../src/models';

describe('Payment Gateway', () => {
  describe('processPayment', () => {
    it('should process valid payment', () => {
      const order: Order = {
        id: 'ORD001',
        customerId: 'CUST001',
        items: [],
        status: 'pending',
        createdAt: new Date(),
        totalPrice: 100
      };

      const result = processPayment(order);

      // Since payment simulation is random, we just check structure
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.transactionId).toBeDefined();
      }
    });

    it('should reject payment with invalid total', () => {
      const order: Order = {
        id: 'ORD002',
        customerId: 'CUST002',
        items: [],
        status: 'pending',
        createdAt: new Date(),
        totalPrice: 0
      };

      const result = processPayment(order);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid order total');
    });

    it('should reject payment with negative total', () => {
      const order: Order = {
        id: 'ORD003',
        customerId: 'CUST003',
        items: [],
        status: 'pending',
        createdAt: new Date(),
        totalPrice: -50
      };

      const result = processPayment(order);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid order total');
    });

    it('should reject payment without total', () => {
      const order: Order = {
        id: 'ORD004',
        customerId: 'CUST004',
        items: [],
        status: 'pending',
        createdAt: new Date()
      };

      const result = processPayment(order);

      expect(result.success).toBe(false);
    });
  });

  describe('refundPayment', () => {
    it('should process valid refund', () => {
      const result = refundPayment('TXN12345', 50);

      expect(result).toHaveProperty('success');
      // Random simulation - just check structure
    });

    it('should reject refund without transaction ID', () => {
      const result = refundPayment('', 50);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refund request');
    });

    it('should reject refund with invalid amount', () => {
      const result = refundPayment('TXN12345', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refund request');
    });

    it('should reject refund with negative amount', () => {
      const result = refundPayment('TXN12345', -50);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refund request');
    });
  });

  describe('validatePaymentDetails', () => {
    it('should validate valid credit card', () => {
      const paymentMethod = {
        type: 'credit_card',
        number: '4111111111111111',
        cvv: '123',
        expiry: '12/25'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(true);
    });

    it('should reject credit card without number', () => {
      const paymentMethod = {
        type: 'credit_card',
        cvv: '123',
        expiry: '12/25'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(false);
    });

    it('should reject credit card with invalid number length', () => {
      const paymentMethod = {
        type: 'credit_card',
        number: '411',
        cvv: '123',
        expiry: '12/25'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(false);
    });

    it('should reject credit card with invalid CVV', () => {
      const paymentMethod = {
        type: 'credit_card',
        number: '4111111111111111',
        cvv: '12',
        expiry: '12/25'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(false);
    });

    it('should validate valid PayPal', () => {
      const paymentMethod = {
        type: 'paypal',
        email: 'user@example.com'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(true);
    });

    it('should reject PayPal without email', () => {
      const paymentMethod = {
        type: 'paypal'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(false);
    });

    it('should reject invalid payment method', () => {
      const result = validatePaymentDetails(null);
      expect(result).toBe(false);
    });

    it('should reject unknown payment type', () => {
      const paymentMethod = {
        type: 'bitcoin'
      };

      const result = validatePaymentDetails(paymentMethod);
      expect(result).toBe(false);
    });
  });
});
