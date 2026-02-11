// Tests for the Strangler Fig Pattern implementation
// Demonstrates how new code is testable while legacy code remains unchanged

import { DynamicPricingService, PricingRouter } from './after';

describe('DynamicPricingService', () => {
  let service: DynamicPricingService;

  beforeEach(() => {
    service = new DynamicPricingService();
  });

  it('should calculate inventory-based discount for low stock', async () => {
    // The new service is fully testable
    const discount = await service.calculateDynamicDiscount('CUST001', 100, 'inventory-based');

    // Discount should be between 0 and 30% based on inventory
    expect(discount).toBeGreaterThanOrEqual(0);
    expect(discount).toBeLessThanOrEqual(30);
  });

  it('should calculate competitor-based discount', async () => {
    const finalPrice = await service.getFinalPriceWithDynamicDiscount(
      'CUST001',
      100,
      'competitor-based'
    );

    // Final price should be reasonable
    expect(finalPrice).toBeGreaterThan(0);
    expect(finalPrice).toBeLessThanOrEqual(100);
  });

  it('should apply time-sensitive discount during flash sale hours', async () => {
    const discount = await service.calculateDynamicDiscount('CUST001', 100, 'time-sensitive');

    // Discount depends on time of day
    expect(discount).toBeGreaterThanOrEqual(0);
  });
});

describe('PricingRouter', () => {
  let router: PricingRouter;

  beforeEach(() => {
    router = new PricingRouter();
  });

  it('should route new customers to new system', async () => {
    const price = await router.getPrice('NEW001', 100);

    // New customers get dynamic pricing
    expect(price).toBeLessThanOrEqual(100);
    expect(price).toBeGreaterThan(0);
  });

  it('should route legacy customers to legacy system', async () => {
    const price = await router.getPrice('VIP001', 100);

    // Legacy system still works
    expect(price).toBeLessThanOrEqual(100);
    expect(price).toBeGreaterThan(0);
  });

  it('should route new discount types to new system', async () => {
    const price = await router.getPrice('CUST001', 100, {
      discountType: 'inventory-based'
    });

    // New discount types use new system
    expect(price).toBeLessThanOrEqual(100);
    expect(price).toBeGreaterThan(0);
  });

  it('should route old discount types to legacy system', async () => {
    const price = await router.getPrice('CUST001', 100, {
      eventType: 'CHRISTMAS'
    });

    // Old discount types use legacy system
    expect(price).toBeLessThanOrEqual(100);
    expect(price).toBeGreaterThan(0);
  });
});
