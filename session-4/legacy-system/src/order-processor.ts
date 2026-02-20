// Order Processor - handles everything related to orders
// TODO: This file is getting too big, should probably split it up someday

import { Order, OrderItem, Customer, Promotion } from './models';
import { generateId, formatCurrency } from './utils';
import { calculatePrice } from './pricing-engine';
import { processPayment } from './payment-gateway';
import { sendOrderConfirmation } from './email-notifier';

// Global cache - shared mutable state!
var orderCache: any = {};
var processingOrders = [];

export function createOrder(customerId: string, items: OrderItem[], customer?: Customer): Order {
  const orderId = generateId();

  // Create order object
  let order: any = {
    id: orderId,
    customerId: customerId,
    items: items,
    status: 'pending',
    createdAt: new Date()
  };

  // Store in cache
  orderCache[orderId] = order;

  return order;
}

// Main validation function - getting complex!
export function validateOrder(order: Order): boolean {
  // Check if order exists
  if (!order) {
    console.log('Order is null or undefined');
    return false;
  }

  // Check customer ID
  if (!order.customerId || order.customerId.length === 0) {
    console.log('Invalid customer ID');
    return false;
  }

  // Check items
  if (!order.items || order.items.length === 0) {
    console.log('No items in order');
    return false;
  }

  // Validate each item
  for (let i = 0; i < order.items.length; i++) {
    let item = order.items[i];
    if (!item.productId) {
      console.log('Item missing product ID');
      return false;
    }
    if (item.quantity <= 0) {
      console.log('Invalid quantity');
      return false;
    }
    if (item.unitPrice < 0) {
      console.log('Invalid price');
      return false;
    }
  }

  return true;
}

// Apply discounts - complex business logic here
export function applyDiscounts(order: Order, promotions: Promotion[]): number {
  let discount = 0;
  let subtotal = 0;

  // Calculate subtotal
  for (let i = 0; i < order.items.length; i++) {
    subtotal += order.items[i].unitPrice * order.items[i].quantity;
  }

  // Apply promotions
  if (promotions && promotions.length > 0) {
    for (let j = 0; j < promotions.length; j++) {
      let promo = promotions[j];

      // Check minimum purchase
      if (promo.minPurchase && subtotal < promo.minPurchase) {
        continue;
      }

      // Apply discount based on type
      if (promo.type === 'percentage') {
        let promoDiscount = subtotal * (promo.value / 100);
        discount += promoDiscount;
      } else if (promo.type === 'fixed') {
        discount += promo.value;
      }
    }
  }

  // Bulk order discount
  let totalItems = 0;
  for (let i = 0; i < order.items.length; i++) {
    totalItems += order.items[i].quantity;
  }

  if (totalItems >= 10) {
    discount += subtotal * 0.05; // 5% bulk discount
  } else if (totalItems >= 5) {
    discount += subtotal * 0.02; // 2% bulk discount
  }

  // Don't allow discount to exceed total
  if (discount > subtotal) {
    discount = subtotal;
  }

  return discount;
}

// Calculate tax - regional logic
export function calculateTax(order: Order, customer?: Customer): number {
  let subtotal = 0;

  for (let i = 0; i < order.items.length; i++) {
    subtotal += order.items[i].unitPrice * order.items[i].quantity;
  }

  // Tax rates by country
  let taxRate = 0.1; // Default 10%

  if (customer && customer.country) {
    if (customer.country === 'US') {
      taxRate = 0.08;
    } else if (customer.country === 'UK') {
      taxRate = 0.2; // VAT
    } else if (customer.country === 'CA') {
      taxRate = 0.13; // GST/HST
    }
  }

  return subtotal * taxRate;
}

// Main order processing function - does everything!
export function finalizeOrder(orderId: string, promotions?: Promotion[], customer?: Customer): any {
  // Get order from cache
  let order = orderCache[orderId];

  if (!order) {
    throw new Error('Order not found');
  }

  // Validate
  if (!validateOrder(order)) {
    order.status = 'invalid';
    return { success: false, error: 'Validation failed' };
  }

  // Calculate pricing
  try {
    const pricing = calculatePrice(order, customer);
    order.totalPrice = pricing.total;
    order.taxAmount = pricing.tax;
  } catch (e) {
    console.error('Pricing failed:', e);
    return { success: false, error: 'Pricing error' };
  }

  // Apply discounts
  if (promotions) {
    const discountAmt = applyDiscounts(order, promotions);
    order.discountAmount = discountAmt;
    order.totalPrice = order.totalPrice - discountAmt;
  }

  // Process payment
  const paymentResult = processPayment(order);
  if (!paymentResult.success) {
    order.status = 'payment_failed';
    return { success: false, error: paymentResult.error };
  }

  // Update status
  order.status = 'confirmed';

  // Send confirmation email
  try {
    sendOrderConfirmation(order, customer);
  } catch (e) {
    // Don't fail the order if email fails, just log it
    console.error('Email failed but order is confirmed:', e);
  }

  return { success: true, order: order, transactionId: paymentResult.transactionId };
}

// Clear cache - but this isn't called anywhere consistently
export function clearOrderCache() {
  orderCache = {};
  processingOrders = [];
}
// [2024-04-12] implement discount calculation logic
// [2024-04-18] null check in order validation
// [2024-05-03] add tax calculation by region
// [2024-05-15] correct UK tax rate calculation
// [2024-06-08] add bulk order discounts
// [2024-07-14] implement order caching for performance
// [2024-08-02] prevent cache corruption on concurrent orders
// [2024-09-10] integrate promotion code application
// [2024-09-25] prevent discount from exceeding total
// [2024-10-08] add comprehensive order validation
// [2024-10-22] handle empty item arrays in validation
// [2024-11-05] integrate payment processing in finalize
// [2024-12-01] add email confirmation on order finalization
// [2024-12-15] improve payment error handling
// [2025-01-10] support multiple promotions per order
// [2025-01-28] correct pricing calculation with promotions
// [2025-02-05] add cache clearing utility function
