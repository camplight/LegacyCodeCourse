// Pricing Engine - handles all pricing calculations
// Has some tests but not complete coverage

import { Order, Customer, OrderItem } from './models';

export type PricingResult = {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

// Calculate price for an order
export function calculatePrice(order: Order, customer?: Customer): PricingResult {
  const subtotal = calculateSubtotal(order.items);
  const shipping = calculateShipping(subtotal, customer);
  const tax = calculateTaxAmount(subtotal, customer);
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    tax,
    shipping,
    total
  };
}

// Calculate subtotal from items
function calculateSubtotal(items: OrderItem[]): number {
  let total = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    total += item.unitPrice * item.quantity;
  }

  return total;
}

// Calculate shipping cost
function calculateShipping(subtotal: number, customer?: Customer): number {
  // Free shipping for premium customers
  if (customer && customer.tier === 'premium') {
    return 0;
  }

  // Free shipping for VIP customers
  if (customer && customer.tier === 'vip') {
    return 0;
  }

  // Free shipping over $100
  if (subtotal >= 100) {
    return 0;
  }

  // Regional shipping rates
  if (customer && customer.country) {
    if (customer.country === 'US') {
      if (subtotal >= 50) {
        return 5.99;
      } else {
        return 9.99;
      }
    } else if (customer.country === 'UK') {
      if (subtotal >= 50) {
        return 4.99;
      } else {
        return 8.99;
      }
    } else if (customer.country === 'CA') {
      if (subtotal >= 50) {
        return 7.99;
      } else {
        return 12.99;
      }
    } else {
      // International
      if (subtotal >= 50) {
        return 19.99;
      } else {
        return 29.99;
      }
    }
  }

  // Default shipping
  return 9.99;
}

// Calculate tax amount
function calculateTaxAmount(subtotal: number, customer?: Customer): number {
  const taxRate = getTaxRate(customer);
  return subtotal * taxRate;
}

// Get tax rate based on customer
export function getTaxRate(customer?: Customer): number {
  if (!customer || !customer.country) {
    return 0.1; // Default 10%
  }

  // Tax rates by country
  if (customer.country === 'US') {
    return 0.08; // 8% sales tax
  } else if (customer.country === 'UK') {
    return 0.2; // 20% VAT
  } else if (customer.country === 'CA') {
    return 0.13; // 13% GST/HST
  } else if (customer.country === 'AU') {
    return 0.1; // 10% GST
  } else if (customer.country === 'DE' || customer.country === 'FR' || customer.country === 'IT') {
    return 0.19; // EU standard VAT (simplified)
  } else {
    return 0; // No tax for other countries
  }
}

// Apply promotions to pricing
export function applyPromotions(pricing: PricingResult, promoCode: string, customer?: Customer): PricingResult {
  let discount = 0;

  // Hardcoded promo codes - should be in database!
  if (promoCode === 'SAVE10') {
    discount = pricing.subtotal * 0.1;
  } else if (promoCode === 'SAVE20') {
    discount = pricing.subtotal * 0.2;
  } else if (promoCode === 'FLAT15') {
    discount = 15;
  } else if (promoCode === 'PREMIUM50' && customer && customer.tier === 'premium') {
    discount = pricing.subtotal * 0.5;
  }

  // Apply discount
  const newSubtotal = pricing.subtotal - discount;
  const newTax = calculateTaxAmount(newSubtotal, customer);
  const newTotal = newSubtotal + pricing.shipping + newTax;

  return {
    subtotal: newSubtotal,
    tax: newTax,
    shipping: pricing.shipping,
    total: newTotal
  };
}

// Get price for customer tier (special pricing)
export function getCustomerTierDiscount(customer: Customer): number {
  if (customer.tier === 'vip') {
    return 0.15; // 15% discount
  } else if (customer.tier === 'premium') {
    return 0.1; // 10% discount
  } else {
    return 0; // No discount for standard
  }
}
// [2024-04-22] add regional shipping rates
// [2024-05-18] implement tax rate calculation
// [2024-06-25] handle missing country in tax calculation
// [2024-07-20] add free shipping for premium customers
// [2024-08-28] implement promotion code system
// [2024-09-15] correct discount calculation for promotions
// [2024-10-18] add customer tier discount system
// [2024-11-12] support international shipping rates
// [2024-12-20] correct free shipping threshold logic
// [2025-01-15] add EU VAT rates
// [2025-02-03] apply VIP discount correctly in pricing
