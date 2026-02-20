# Legacy E-Commerce System

## Overview

This is an **intentionally messy legacy codebase** created for training purposes. It demonstrates realistic legacy code problems including:
- Complex, untested code
- Frequent bug fixes
- God classes
- Global mutable state
- Tight coupling
- Inconsistent patterns

**⚠️ This is NOT production-quality code.** It's educational material showing problematic patterns.

## System Architecture

### Core Modules

**order-processor.ts** (160 LOC)
- Handles entire order lifecycle
- **Issues:**
  - God class (does everything)
  - High complexity (cyclomatic: 18)
  - Zero test coverage
  - Global mutable state (`orderCache`)
  - Mixed concerns (validation, pricing, payment, email)
- **Status:** 🚨 Critical - needs refactoring before Q2 features

**email-notifier.ts** (90 LOC)
- Sends order-related emails
- **Issues:**
  - Hardcoded SMTP credentials
  - No error handling or retry logic
  - Zero test coverage
  - Highest bug count (14 fixes)
  - Random failures with no recovery
- **Status:** 🚨 Critical - rewrite recommended

**pricing-engine.ts** (145 LOC)
- Calculates order pricing, tax, shipping
- **Issues:**
  - Deep nesting in shipping logic
  - Magic numbers everywhere
  - Hardcoded tax rates and promo codes
- **Strengths:**
  - 70% test coverage (partial)
  - Some well-tested functions
- **Status:** ⚠️ Moderate - needs test completion and refactoring

**inventory-manager.ts** (95 LOC)
- Manages product stock levels
- **Strengths:**
  - Well-tested (100% coverage)
  - Simple, focused functions
  - Good separation of concerns
- **Status:** ✅ Stable - use as example of good design

**payment-gateway.ts** (100 LOC)
- Handles payment processing
- **Strengths:**
  - Well-tested (95% coverage)
  - Good error handling
  - Simple validation logic
- **Status:** ✅ Stable

**shipping-calculator.ts** (95 LOC)
- Calculates shipping costs and delivery dates
- **Strengths:**
  - Well-tested (97% coverage)
  - Clean function design
  - Low complexity
- **Status:** ✅ Stable

### Supporting Files

**models.ts** (40 LOC)
- Type definitions for Order, Customer, Product, etc.
- Uses TypeScript `any` types (legacy pattern)

**utils.ts** (30 LOC)
- Helper functions for IDs, currency formatting, dates
- Contains dead code
- Has duplicate functions (formatCurrency vs toDollars)

**index.ts** (30 LOC)
- Express.js API server (minimal, for demo only)

## Known Issues

### High-Risk Files

**order-processor.ts:**
- 18 commits (6 bug fixes)
- Complexity: 18
- Coverage: 0%
- **Risk Score: 384** (Critical)
- **Impact:** Core business logic, required for Q2 subscriptions

**email-notifier.ts:**
- 22 commits (14 bug fixes - highest in system!)
- Complexity: 8
- Coverage: 0%
- Bug ratio: 63.6%
- **Risk Score: 200** (Critical)
- **Impact:** Customer communication, required for Q3 email templates

### Specific Bugs and Anti-Patterns

**Global State (order-processor.ts):**
```typescript
var orderCache: any = {}; // Global mutable state!
var processingOrders = []; // Never cleaned up
```
- Causes race conditions
- Memory leaks
- Hard to test

**Hardcoded Credentials (email-notifier.ts):**
```typescript
const SMTP_CONFIG = {
  host: 'smtp.example.com',
  port: 587,
  user: 'noreply@ecommerce.com',
  pass: 'hardcoded-password-123' // Security issue!
};
```

**Deep Nesting (pricing-engine.ts):**
```typescript
if (customer && customer.country) {
  if (customer.country === 'US') {
    if (subtotal >= 50) {
      return 5.99;
    } else {
      return 9.99;
    }
  } else if (customer.country === 'UK') {
    // More nesting...
  }
}
```

**Magic Numbers Everywhere:**
```typescript
if (totalItems >= 10) {
  discount += subtotal * 0.05; // What's 0.05?
}
```

**Null Safety Issues:**
```typescript
sendEmail({
  to: customer?.email, // What if customer is undefined?
  subject: 'Order Confirmation',
  body: emailBody
});
```

## Running the System

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

**Expected test results:**
- ✅ ~10-15 tests pass
- ⚠️ Overall coverage: ~40-50%
- 🚨 Some files: 0% coverage

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Git History

The system has ~60 commits over 2 years (Feb 2024 - Feb 2025) showing:

**Change Patterns:**
- order-processor.ts: 18 commits (12 features, 6 bugs)
- email-notifier.ts: 22 commits (8 features, 14 bugs) ⚠️ Highest bug ratio
- pricing-engine.ts: 12 commits (8 features, 4 bugs)
- Stable files: 2-4 commits each

**Authors:**
- John Legacy (initial implementation, many features)
- Sarah Maintainer (bug fixes, maintenance)
- Mike Feature (new features)

**Commit Types:**
- `feat:` - New features
- `fix:` - Bug fixes
- Features vs. Bugs ratio reveals code quality

## Business Context

This system supports an e-commerce business with:

**Current Revenue:** ~$2M annual
**Customer Base:** ~10,000 active customers
**Order Volume:** ~500 orders/week

**Upcoming Features (see `../business-roadmap.md`):**

**Q1 2024:**
- Multi-currency support (expand to Europe)
- Advanced discount rules

**Q2 2024:**
- **Subscription orders** (estimated $500K ARR) ⚠️ Blocked by order-processor.ts risk
- Fraud detection

**Q3 2024:**
- International shipping
- Email template system ⚠️ Blocked by email-notifier.ts quality

## Modernization Recommendations

### Phase 1: Before Q1 Features (1.5 weeks)
**Target:** pricing-engine.ts
- Add tests for uncovered branches (30% gap)
- Extract tax rate lookup table
- Extract shipping rate lookup table
- Reduce calculateShipping complexity
**Outcome:** Safe foundation for Q1 multi-currency and discount features

### Phase 2: Before Q2 Subscriptions (3 weeks)
**Target:** order-processor.ts
- Add comprehensive characterization tests
- Refactor into modules:
  - order-validation.ts
  - order-pricing.ts
  - order-workflow.ts
- Remove global state
- Introduce dependency injection
**Outcome:** order-processor.ts ready for complex subscription logic

### Phase 3: Before Q3 Email Features (3 weeks)
**Target:** email-notifier.ts
- Add characterization tests for current behavior
- Complete rewrite with template system
- Externalize configuration
- Add retry logic and proper error handling
**Outcome:** Modern, reliable email system

**Total Investment:** 7.5 weeks
**ROI:** Enables $500K subscription revenue + reduces bug rate + increases velocity

## Testing Strategy

### Files with Good Tests (Use as Examples)
- inventory-manager.test.ts (100% coverage)
- payment-gateway.test.ts (95% coverage)
- shipping-calculator.test.ts (97% coverage)

**What makes them good:**
- Test behavior through public API
- Use factory functions for test data
- Cover edge cases and error paths
- Clear test names

### Files Needing Tests (Urgent)
- order-processor.ts (0% coverage)
- email-notifier.ts (0% coverage)

**Recommended approach:**
1. Write characterization tests (capture current behavior)
2. Achieve reasonable coverage (>70%)
3. Refactor with test safety net
4. Add feature tests as you go

### Partial Coverage Needs Completion
- pricing-engine.test.ts (70% coverage)

**Missing:**
- SAVE20, PREMIUM50 promo codes
- International shipping rates
- Australia, Germany, France, Italy tax rates

## File Statistics

```
File                     LOC  Complexity  Coverage  Changes  Bugs  Risk
------------------------------------------------------------------------
order-processor.ts       160      18         0%      18      6    384
email-notifier.ts         90       8         0%      22     14    200
pricing-engine.ts        145      14        70%      12      4     87
inventory-manager.ts      95       6       100%       4      0      0
payment-gateway.ts       100       7        95%       3      0      0
shipping-calculator.ts    95       5        97%       2      0      0
models.ts                 40       1         -        -      -      -
utils.ts                  30       3         -        -      -      -
------------------------------------------------------------------------
TOTAL                    755      62      ~45%      61     24    671
```

## Anti-Patterns Catalog

This system demonstrates these common legacy patterns (for educational purposes):

### God Classes
- **Example:** order-processor.ts handles validation, pricing, payment, email, caching
- **Solution:** Single Responsibility Principle - split into focused modules

### Global Mutable State
- **Example:** `var orderCache = {}` in order-processor.ts
- **Solution:** Dependency injection, stateless functions

### Deep Nesting
- **Example:** Nested if/else in calculateShipping
- **Solution:** Early returns, guard clauses, strategy pattern

### Magic Numbers
- **Example:** `0.05`, `5.99`, `100` scattered throughout
- **Solution:** Named constants with semantic meaning

### No Tests
- **Example:** order-processor.ts, email-notifier.ts
- **Solution:** Characterization tests, then refactor

### Hardcoded Configuration
- **Example:** SMTP credentials in email-notifier.ts
- **Solution:** Environment variables, configuration files

### Poor Error Handling
- **Example:** Try/catch that logs but doesn't recover
- **Solution:** Proper error types, retry logic, circuit breakers

### Tight Coupling
- **Example:** order-processor.ts directly calls email-notifier.ts
- **Solution:** Event-driven architecture, dependency injection

## Development Guidelines

### DO (This is Legacy Code)
- ✅ Write messy code (it's intentional)
- ✅ Add bugs occasionally (demonstrates analysis)
- ✅ Use anti-patterns (educational value)
- ✅ Mix concerns (shows real legacy problems)
- ✅ Create complex functions (demonstrates metrics)

### DON'T (This is Training Material)
- ❌ Apply clean code practices from global CLAUDE.md
- ❌ Refactor without being asked
- ❌ Add tests to untested files (students will do this)
- ❌ Fix bugs (students will discover them)

## Support

For questions about:
- **The legacy system:** See this README
- **Analysis techniques:** See `../analysis-guides/`
- **Business context:** See `../business-roadmap.md`
- **Workshop goals:** See `../GOAL.md`
- **Session overview:** See `../README.md`

## License

MIT License - Educational purposes only.

---

**Remember:** This is intentionally problematic code for training. The goal is to learn analysis and modernization techniques, not to judge the code quality. Every issue exists for a reason - to teach you how to identify and prioritize technical debt using data-driven methods.
