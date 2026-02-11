# Sprout Classes Pattern

## What is This Pattern?

When you need to add new functionality to legacy code but the existing class is too fragile or complex to modify safely, create a new class (the "sprout") to handle the new feature. The legacy class calls into the new class at a single integration point, minimizing risk while keeping new code clean and testable.

## The Problem

The legacy `InvoiceGenerator` is a monolithic class with serious issues:

- **God class** - Does everything: formatting, layout, calculations, business logic
- **String manipulation nightmare** - Hard to understand and modify
- **No separation of concerns** - Presentation mixed with business logic
- **Hard to test pieces** - Can't test calculations without generating full invoice
- **Fragile** - One mistake could break invoice generation for all customers

**New Requirement**: Add tax calculation for multiple countries (UK: 20% VAT, US: varies by state, EU: 19-27% VAT).

**The Catch**: The invoice generator is complex and fragile. It's used in production to generate thousands of invoices daily. Modifying it directly risks breaking existing functionality.

## The Solution

Instead of modifying the fragile legacy class, we "sprout" a new class:

1. **Create `TaxCalculator` class** - Handles all tax logic, completely independent
2. **Minimal integration point** - Legacy class calls `taxCalculator.calculateTax(order)` in ONE place
3. **Test the sprout** - Comprehensive tests for `TaxCalculator` without touching legacy code
4. **No risk to legacy** - Invoice formatting logic remains untouched

The sprout class is:
- **Independent** - No dependencies on legacy code
- **Focused** - Single responsibility (tax calculation)
- **Testable** - Pure business logic, easy to test
- **Clean** - Written with modern best practices

## Files in This Example

- **before.ts** - Monolithic invoice generator with no tax calculation
- **after.ts** - Two parts:
  - `InvoiceGenerator` (legacy, minimally changed)
  - `TaxCalculator` (the sprout - new, clean, testable)
- **after.test.ts** - Comprehensive tests for `TaxCalculator` sprout class

## Running the Example

```bash
npm install
npm test
```

## Key Learning Points

1. **Minimal risk** - Legacy code barely changed (one method call added)
2. **Maximum testability** - New code is independently testable
3. **Clean separation** - Tax logic isolated from presentation logic
4. **Easy to enhance** - Adding new countries is trivial in `TaxCalculator`
5. **Safe evolution** - Legacy code can be gradually refactored later

## The Integration Point

**Before** (No Tax):
```typescript
class InvoiceGenerator {
  generatePDF(order: Order): string {
    // ... complex formatting code ...
    invoice += `Subtotal: £${subtotal}\n`;
    invoice += `TOTAL: £${subtotal}\n`;  // No tax!
    // ... more formatting ...
  }
}
```

**After** (With Sprout):
```typescript
class InvoiceGenerator {
  private taxCalculator = new TaxCalculator();  // ← Sprout instance

  generatePDF(order: Order): string {
    // ... same complex formatting code (unchanged) ...

    const taxInfo = this.taxCalculator.calculateTax(order);  // ← ONE LINE!

    invoice += `Subtotal: £${subtotal}\n`;
    invoice += `Tax (${taxInfo.rate}%): £${taxInfo.amount}\n`;
    invoice += `TOTAL: £${subtotal + taxInfo.amount}\n`;

    // ... same formatting code (unchanged) ...
  }
}

// The sprout - completely independent and testable
class TaxCalculator {
  calculateTax(order: Order): TaxBreakdown {
    // Clean, focused, testable logic
  }
}
```

## Why This Works

- **Legacy class responsibility**: Formatting invoices (unchanged)
- **Sprout class responsibility**: Calculating taxes (new, clean)
- **Integration**: One method call - minimal coupling
- **Testing**: Sprout has comprehensive tests; legacy class already tested in production

## Exercise

Your task: Add **discount calculation** as a new sprout class.

Requirements:
1. Create a `DiscountCalculator` class that handles:
   - Volume discounts (>10 items: 5%, >20 items: 10%)
   - Loyalty discounts (returning customers: extra 5%)
   - Seasonal discounts (specified percentage)
2. Return a `DiscountBreakdown` with:
   - Total discount amount
   - Discount percentage applied
   - Breakdown by discount type
3. Integrate into `InvoiceGenerator` with **minimal changes** (1-2 lines)
4. Write comprehensive tests for your sprout class
5. **Constraint**: Do NOT modify the existing formatting logic in `InvoiceGenerator`

Hints:
- The sprout should be completely independent
- You'll need to extend the `Order` interface with discount-related data
- Think about where in the invoice the discount should appear
- Test edge cases: no discounts, multiple discount types, maximum discount caps

## Further Reading

- "Working Effectively with Legacy Code" by Michael Feathers, Chapter 11: "Sprout Method and Sprout Class"
- Keep the sprout focused on one responsibility
- Consider sprouting when the legacy class is too complex to modify safely
