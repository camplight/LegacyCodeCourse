// STRANGLER FIG PATTERN - Gradual Migration
// This demonstrates wrapping legacy code with new implementation

import * as fs from 'fs';

// ============================================================================
// LEGACY CODE (Kept for backward compatibility - minimally changed)
// ============================================================================

const CONFIG = {
  CHRISTMAS_DISCOUNT: 0.25,
  BLACK_FRIDAY_DISCOUNT: 0.40,
  DB_PATH: './customer_loyalty.db'
};

class LegacyDatabase {
  static readCustomerTier(customerId: string): string {
    const data = fs.existsSync(CONFIG.DB_PATH)
      ? fs.readFileSync(CONFIG.DB_PATH, 'utf-8')
      : '{}';
    const db = JSON.parse(data || '{}');
    return db[customerId] || 'bronze';
  }
}

class LegacyLoyaltyAPI {
  static fetchLoyaltyPoints(customerId: string): number {
    if (customerId.startsWith('VIP')) return 5000;
    if (customerId.startsWith('GOLD')) return 2000;
    return 100;
  }
}

// Original calculator - kept unchanged for legacy customers
export class DiscountCalculator {
  calculateDiscount(customerId: string, productPrice: number, eventType?: string): number {
    let discount = 0;

    if (eventType === 'CHRISTMAS') {
      discount = productPrice * CONFIG.CHRISTMAS_DISCOUNT;
    } else if (eventType === 'BLACK_FRIDAY') {
      discount = productPrice * CONFIG.BLACK_FRIDAY_DISCOUNT;
    }

    const tier = LegacyDatabase.readCustomerTier(customerId);
    if (tier === 'gold') {
      discount += productPrice * 0.10;
    } else if (tier === 'silver') {
      discount += productPrice * 0.05;
    }

    const points = LegacyLoyaltyAPI.fetchLoyaltyPoints(customerId);
    if (points > 1000) {
      discount += productPrice * 0.15;
    } else if (points > 500) {
      discount += productPrice * 0.08;
    }

    if (discount > productPrice * 0.60) {
      discount = productPrice * 0.60;
    }

    return discount;
  }

  getFinalPrice(customerId: string, productPrice: number, eventType?: string): number {
    const discount = this.calculateDiscount(customerId, productPrice, eventType);
    return productPrice - discount;
  }
}

// ============================================================================
// NEW IMPLEMENTATION (The "Fig" that will eventually replace the legacy tree)
// ============================================================================

// New service with modern architecture
// - Async by design (returns Promises)
// - Dependency injection ready
// - Testable
// - Handles new discount types
export class DynamicPricingService {
  async calculateDynamicDiscount(
    customerId: string,
    productPrice: number,
    discountType: 'inventory-based' | 'competitor-based' | 'time-sensitive'
  ): Promise<number> {
    let discount = 0;

    if (discountType === 'inventory-based') {
      // New feature: discount based on inventory levels
      const inventoryLevel = await this.getInventoryLevel();
      if (inventoryLevel < 10) {
        discount = productPrice * 0.30; // High discount for low stock
      } else if (inventoryLevel < 50) {
        discount = productPrice * 0.15;
      }
    } else if (discountType === 'competitor-based') {
      // New feature: match competitor pricing
      const competitorPrice = await this.getCompetitorPrice();
      if (competitorPrice < productPrice) {
        discount = productPrice - competitorPrice;
      }
    } else if (discountType === 'time-sensitive') {
      // New feature: flash sales based on time of day
      const hour = new Date().getHours();
      if (hour >= 14 && hour <= 16) { // 2-4 PM flash sale
        discount = productPrice * 0.35;
      }
    }

    return discount;
  }

  async getFinalPriceWithDynamicDiscount(
    customerId: string,
    productPrice: number,
    discountType: 'inventory-based' | 'competitor-based' | 'time-sensitive'
  ): Promise<number> {
    const discount = await this.calculateDynamicDiscount(customerId, productPrice, discountType);
    return productPrice - discount;
  }

  private async getInventoryLevel(): Promise<number> {
    // Simulated async API call
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.floor(Math.random() * 100)), 10);
    });
  }

  private async getCompetitorPrice(): Promise<number> {
    // Simulated async API call
    return new Promise(resolve => {
      setTimeout(() => resolve(75 + Math.random() * 25), 10);
    });
  }
}

// ============================================================================
// ROUTER (The "Strangler" - routes between old and new)
// ============================================================================

// This is the key to the strangler fig pattern
// It decides whether to use legacy or new implementation
export class PricingRouter {
  private legacyCalculator = new DiscountCalculator();
  private dynamicPricingService = new DynamicPricingService();

  async getPrice(
    customerId: string,
    productPrice: number,
    options?: {
      eventType?: string;
      discountType?: 'inventory-based' | 'competitor-based' | 'time-sensitive';
    }
  ): Promise<number> {
    // Route to new system for new discount types
    if (options?.discountType) {
      return this.dynamicPricingService.getFinalPriceWithDynamicDiscount(
        customerId,
        productPrice,
        options.discountType
      );
    }

    // Route to new system for customers enrolled in beta
    if (this.isNewCustomer(customerId)) {
      // New customers get time-sensitive pricing by default
      return this.dynamicPricingService.getFinalPriceWithDynamicDiscount(
        customerId,
        productPrice,
        'time-sensitive'
      );
    }

    // Route to legacy system for existing customers and old discount types
    return this.legacyCalculator.getFinalPrice(customerId, productPrice, options?.eventType);
  }

  private isNewCustomer(customerId: string): boolean {
    // Simple check: customers with ID starting with 'NEW' are routed to new system
    return customerId.startsWith('NEW');
  }
}

// Example usage
if (require.main === module) {
  const router = new PricingRouter();

  (async () => {
    console.log('Strangler Fig Pattern - Pricing Router');
    console.log('======================================');

    // Legacy customer - routed to old system
    const legacyPrice = await router.getPrice('VIP001', 100, { eventType: 'CHRISTMAS' });
    console.log(`Legacy customer (VIP001): £${legacyPrice.toFixed(2)}`);

    // New customer - routed to new system
    const newCustomerPrice = await router.getPrice('NEW001', 100);
    console.log(`New customer (NEW001): £${newCustomerPrice.toFixed(2)}`);

    // Using new discount type - routed to new system
    const inventoryPrice = await router.getPrice('CUST001', 100, { discountType: 'inventory-based' });
    console.log(`Inventory-based pricing: £${inventoryPrice.toFixed(2)}`);
  })();
}
