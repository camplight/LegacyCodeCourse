// Payment Gateway - handles payment processing
// This module is stable and well-tested

import { Order, PaymentResult } from './models';
import { generateId } from './utils';

// Process a payment for an order
export function processPayment(order: Order): PaymentResult {
  // Validate order has a total
  if (!order.totalPrice || order.totalPrice <= 0) {
    return {
      success: false,
      error: 'Invalid order total'
    };
  }

  // Simulate payment processing
  // In production, this would call a real payment gateway API
  const success = simulatePaymentProcessing(order.totalPrice);

  if (success) {
    return {
      success: true,
      transactionId: generateId()
    };
  } else {
    return {
      success: false,
      error: 'Payment declined'
    };
  }
}

// Simulate payment processing (for testing)
function simulatePaymentProcessing(amount: number): boolean {
  // Simulate a 95% success rate
  // In production, this would be a real API call
  return Math.random() > 0.05;
}

// Refund a payment
export function refundPayment(transactionId: string, amount: number): PaymentResult {
  if (!transactionId || !amount || amount <= 0) {
    return {
      success: false,
      error: 'Invalid refund request'
    };
  }

  // Simulate refund processing
  const success = Math.random() > 0.01; // 99% success rate

  if (success) {
    return {
      success: true,
      transactionId: generateId()
    };
  } else {
    return {
      success: false,
      error: 'Refund failed'
    };
  }
}

// Validate payment details
export function validatePaymentDetails(paymentMethod: any): boolean {
  if (!paymentMethod) {
    return false;
  }

  // Basic validation
  if (paymentMethod.type === 'credit_card') {
    return validateCreditCard(paymentMethod);
  } else if (paymentMethod.type === 'paypal') {
    return validatePayPal(paymentMethod);
  }

  return false;
}

// Validate credit card
function validateCreditCard(card: any): boolean {
  if (!card.number || !card.cvv || !card.expiry) {
    return false;
  }

  // Basic checks
  if (card.number.length < 13 || card.number.length > 19) {
    return false;
  }

  if (card.cvv.length < 3 || card.cvv.length > 4) {
    return false;
  }

  return true;
}

// Validate PayPal
function validatePayPal(paypal: any): boolean {
  if (!paypal.email) {
    return false;
  }

  // Very basic email validation
  return paypal.email.includes('@');
}
// [2024-08-15] add refund functionality
// [2025-01-05] add payment validation
