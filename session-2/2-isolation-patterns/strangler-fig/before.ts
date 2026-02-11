// LEGACY DISCOUNT CALCULATOR - E-commerce System
// This is intentionally messy legacy code for training purposes

import * as fs from 'fs';

// Global configuration - tightly coupled
const CONFIG = {
  CHRISTMAS_DISCOUNT: 0.25,
  BLACK_FRIDAY_DISCOUNT: 0.40,
  DB_PATH: './customer_loyalty.db'
};

// Mock database - simulates synchronous DB reads
class LegacyDatabase {
  static readCustomerTier(customerId: string): string {
    // In real legacy code, this might be a blocking file read or DB call
    const data = fs.existsSync(CONFIG.DB_PATH)
      ? fs.readFileSync(CONFIG.DB_PATH, 'utf-8')
      : '{}';
    const db = JSON.parse(data || '{}');
    return db[customerId] || 'bronze';
  }
}

// Mock external API - simulates synchronous HTTP call
class LegacyLoyaltyAPI {
  static fetchLoyaltyPoints(customerId: string): number {
    // In real legacy code, this might be a blocking HTTP request
    // Simulating with hard-coded values
    if (customerId.startsWith('VIP')) return 5000;
    if (customerId.startsWith('GOLD')) return 2000;
    return 100;
  }
}

// THE MONOLITHIC DISCOUNT CALCULATOR
// Problems:
// - God class with all logic in one place
// - Hard-coded discount rules
// - Direct database calls mixed with business logic
// - Synchronous external API calls (blocking)
// - Global state and configuration
// - Impossible to test without database/API
// - No separation of concerns
export class DiscountCalculator {
  // Giant method with all discount logic
  calculateDiscount(customerId: string, productPrice: number, eventType?: string): number {
    let discount = 0;

    // Check event-based discounts
    if (eventType === 'CHRISTMAS') {
      discount = productPrice * CONFIG.CHRISTMAS_DISCOUNT;
    } else if (eventType === 'BLACK_FRIDAY') {
      discount = productPrice * CONFIG.BLACK_FRIDAY_DISCOUNT;
    }

    // Add loyalty tier discounts on top
    const tier = LegacyDatabase.readCustomerTier(customerId); // Blocking DB call!
    if (tier === 'gold') {
      discount += productPrice * 0.10;
    } else if (tier === 'silver') {
      discount += productPrice * 0.05;
    }

    // Add points-based discount
    const points = LegacyLoyaltyAPI.fetchLoyaltyPoints(customerId); // Blocking API call!
    if (points > 1000) {
      discount += productPrice * 0.15;
    } else if (points > 500) {
      discount += productPrice * 0.08;
    }

    // Cap discount at 60% of product price
    if (discount > productPrice * 0.60) {
      discount = productPrice * 0.60;
    }

    return discount;
  }

  // Another method that's tightly coupled
  getFinalPrice(customerId: string, productPrice: number, eventType?: string): number {
    const discount = this.calculateDiscount(customerId, productPrice, eventType);
    return productPrice - discount;
  }
}

// Example usage
if (require.main === module) {
  const calculator = new DiscountCalculator();
  console.log('Legacy Discount Calculator');
  console.log('=========================');
  console.log(`Price for regular customer: £${calculator.getFinalPrice('CUST001', 100)}`);
  console.log(`Price for VIP customer: £${calculator.getFinalPrice('VIP001', 100)}`);
  console.log(`Christmas price: £${calculator.getFinalPrice('CUST001', 100, 'CHRISTMAS')}`);
}
