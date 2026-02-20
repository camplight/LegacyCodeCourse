// Shipping Calculator - calculates shipping costs and estimates delivery
// This module is stable with good test coverage

import { Order, ShippingOption, Customer } from './models';

// Calculate shipping options for an order
export function calculateShippingOptions(order: Order, customer?: Customer): ShippingOption[] {
  const options: ShippingOption[] = [];

  // Standard shipping
  options.push({
    method: 'standard',
    cost: calculateStandardShipping(order, customer),
    estimatedDays: 5
  });

  // Express shipping
  options.push({
    method: 'express',
    cost: calculateExpressShipping(order, customer),
    estimatedDays: 2
  });

  // Overnight shipping
  options.push({
    method: 'overnight',
    cost: calculateOvernightShipping(order, customer),
    estimatedDays: 1
  });

  return options;
}

// Calculate standard shipping cost
function calculateStandardShipping(order: Order, customer?: Customer): number {
  const baseRate = 9.99;

  // Free shipping for orders over $100
  const orderTotal = calculateOrderTotal(order);
  if (orderTotal >= 100) {
    return 0;
  }

  // Premium customers get free standard shipping
  if (customer && (customer.tier === 'premium' || customer.tier === 'vip')) {
    return 0;
  }

  return baseRate;
}

// Calculate express shipping cost
function calculateExpressShipping(order: Order, customer?: Customer): number {
  const baseRate = 19.99;

  // VIP customers get 50% off express shipping
  if (customer && customer.tier === 'vip') {
    return baseRate * 0.5;
  }

  return baseRate;
}

// Calculate overnight shipping cost
function calculateOvernightShipping(order: Order, customer?: Customer): number {
  const baseRate = 34.99;

  // VIP customers get 25% off overnight shipping
  if (customer && customer.tier === 'vip') {
    return baseRate * 0.75;
  }

  return baseRate;
}

// Calculate order total (helper)
function calculateOrderTotal(order: Order): number {
  let total = 0;

  for (const item of order.items) {
    total += item.unitPrice * item.quantity;
  }

  return total;
}

// Estimate delivery date
export function estimateDeliveryDate(shippingMethod: string): Date {
  const today = new Date();
  let daysToAdd = 5; // Default to standard

  if (shippingMethod === 'express') {
    daysToAdd = 2;
  } else if (shippingMethod === 'overnight') {
    daysToAdd = 1;
  }

  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + daysToAdd);

  return deliveryDate;
}
// [2024-11-18] add delivery date estimation
