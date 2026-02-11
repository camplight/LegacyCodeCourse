# Strangler Fig Pattern

## What is This Pattern?

The Strangler Fig pattern, named after a type of tree that grows around and eventually replaces its host, is a technique for gradually replacing legacy systems. Instead of a risky "big bang" rewrite, you build new functionality alongside the old system and incrementally route traffic from the legacy code to the new code until the legacy system can be safely removed.

## The Problem

The legacy `DiscountCalculator` has several serious issues:

- **God class** - All discount logic crammed into one place
- **Blocking I/O** - Synchronous database and API calls that freeze the application
- **Global state** - Hard-coded configuration makes testing impossible
- **Tight coupling** - Direct dependencies on database and external API
- **No extensibility** - Adding new discount types requires modifying core logic

**New Requirement**: Add dynamic pricing based on real-time inventory levels and competitor pricing. This requires async external API calls, which the legacy synchronous system cannot handle.

**The Catch**: The legacy calculator is used throughout the application. Changing it directly would be risky and could break existing functionality for thousands of customers.

## The Solution

The Strangler Fig pattern lets us:

1. **Keep legacy code untouched** - Existing customers continue using the old system with zero risk
2. **Build new system separately** - `DynamicPricingService` implements modern async architecture
3. **Route intelligently** - `PricingRouter` decides which system to use based on:
   - Customer type (new customers → new system)
   - Discount type (new types → new system, old types → legacy)
   - Feature flags (gradual rollout)
4. **Migrate gradually** - Over time, route more traffic to the new system
5. **Eventually remove legacy** - Once all traffic is routed to new system, delete old code

## Files in This Example

- **before.ts** - Legacy monolithic discount calculator with blocking I/O and tight coupling
- **after.ts** - Three components:
  - `DiscountCalculator` (legacy, unchanged)
  - `DynamicPricingService` (new, modern, async)
  - `PricingRouter` (the strangler - routes between old and new)
- **after.test.ts** - Tests demonstrating that new code is testable while legacy remains unchanged

## Running the Example

```bash
npm install
npm test
```

## Key Learning Points

1. **Zero risk to existing customers** - Legacy code is never modified, so existing functionality cannot break
2. **Gradual migration** - Route traffic incrementally (new customers first, then specific features, then everyone)
3. **Rollback safety** - If new system has issues, just route traffic back to legacy system
4. **Modern architecture in new code** - New code can use async/await, dependency injection, and proper testing
5. **Clear migration path** - Router makes it obvious which code handles which scenarios

## Migration Strategy

The example demonstrates a phased migration:

**Phase 1** (Current):
- New customers (`NEW*` IDs) → New system
- New discount types (`inventory-based`, `competitor-based`) → New system
- Legacy customers with old discount types → Legacy system

**Phase 2** (Future):
- Route 10% of legacy customers to new system
- Monitor for issues
- Gradually increase percentage

**Phase 3** (Future):
- All customers on new system
- Delete legacy `DiscountCalculator`
- The fig has replaced the tree!

## Exercise

Your task: Implement a feature flag system in the `PricingRouter` that allows you to control the percentage of legacy customers routed to the new system.

Add a method:
```typescript
setNewSystemPercentage(percentage: number): void
```

Modify the routing logic to:
- Route the specified percentage of legacy customers to the new system
- Use a deterministic method (e.g., hash customer ID) so the same customer always gets the same system

Test your implementation with different percentages (0%, 50%, 100%).

## Further Reading

- "Working Effectively with Legacy Code" by Michael Feathers, Chapter 13
- Martin Fowler's article: https://martinfowler.com/bliki/StranglerFigApplication.html
