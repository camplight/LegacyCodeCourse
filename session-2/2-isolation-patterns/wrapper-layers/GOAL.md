# Wrapper Layers Pattern (Adapter Pattern)

## What is This Pattern?

A wrapper (or adapter) provides a new interface to legacy code without modifying the legacy code itself. It translates between the old interface and a new, cleaner interface. This is especially useful when legacy code has an awkward interface (callbacks, poor naming, unstructured data) but is too risky or widespread to modify directly.

## The Problem

The legacy `CustomerDB` has a terrible interface:

**Issues:**
- **Callback-based** - Can't use modern async/await
- **Unstructured data** - `any` types everywhere, no type safety
- **Poor naming** - Database-style `snake_case` fields (`customer_name`, `email_address`)
- **String dates** - Dates returned as strings ("2024-01-15 14:30:00"), not Date objects
- **Numeric IDs** - Uses numbers instead of strings
- **No validation** - Accepts any data structure

**New Requirement**: New parts of the application need a modern async/await interface with clean, typed data.

**The Catch**: The `CustomerDB` is used in 50+ places throughout the legacy application. Modifying it would require changing all those call sites, risking bugs. We need a modern interface for new code while keeping legacy code working.

## The Solution

Create a wrapper that provides a clean interface while internally using the legacy code:

1. **Define modern interface** - `Customer` type with clean naming (camelCase, proper types)
2. **Wrap legacy code** - `ModernCustomerService` wraps `CustomerDB`
3. **Adapt interface** - Convert callbacks → Promises, transform data format
4. **Zero changes to legacy** - `CustomerDB` completely unchanged

The wrapper acts as a translator between old and new worlds.

## Files in This Example

- **before.ts** - Legacy database layer with callbacks, untyped data, poor naming
- **after.ts** - Two parts:
  - `CustomerDB` (legacy, completely unchanged)
  - `ModernCustomerService` (wrapper providing clean interface)
  - `Customer` interface (modern, typed data structure)
- **after.test.ts** - Tests for wrapper's transformation and adaptation

## Running the Example

```bash
npm install
npm test
```

## Key Learning Points

1. **Legacy code untouched** - Zero modifications to `CustomerDB`
2. **Modern interface** - New code uses async/await, typed data, clean naming
3. **Adapter pattern** - Wrapper translates between interfaces
4. **Gradual migration** - New code uses wrapper; legacy code still works
5. **Data transformation** - Wrapper handles format conversion transparently

## The Transformation

**Legacy Interface** (Callback-based, untyped):
```typescript
db.getCustomerById(1, (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data.customer_name);     // snake_case
    console.log(data.created_date);      // string: "2024-01-15 14:30:00"
  }
});
```

**Modern Interface** (Async/await, typed):
```typescript
const customer: Customer = await service.getCustomer('1');
console.log(customer.name);       // camelCase
console.log(customer.createdAt);  // Date object
```

## What the Wrapper Does

**Interface Adaptation:**
- Callbacks → Promises (async/await)
- Error-first callbacks → Promise rejection

**Data Transformation:**
- `customer_id` (number) → `id` (string)
- `customer_name` → `name` (camelCase)
- `email_address` → `email` (camelCase)
- `created_date` (string) → `createdAt` (Date)
- `last_login` (string | null) → `lastLogin` (Date | null)

**Type Safety:**
- `any` → `Customer` (typed interface)
- Compile-time checks for new code
- Runtime transformation ensures data consistency

## Exercise

Your task: Extend the wrapper to support **customer search** functionality.

Requirements:
1. Add a method to `ModernCustomerService`:
   ```typescript
   async searchCustomers(query: string): Promise<Customer[]>
   ```
2. The search should:
   - Find customers by name (case-insensitive)
   - Find customers by email (case-insensitive)
   - Return all matching customers
3. **Implementation approach**:
   - Use the existing `listCustomers()` wrapper method
   - Filter the results based on the query
   - Do NOT modify `CustomerDB` class
4. Write tests for:
   - Searching by name
   - Searching by email
   - Case-insensitive matching
   - No results found
   - Multiple results

Bonus:
- Add pagination support (`page` and `pageSize` parameters)
- Add sorting options (by name, by email, by createdAt)

Hints:
- The wrapper can combine multiple legacy calls
- Use the existing transformation methods
- All logic should be in the wrapper
- Legacy code remains completely unchanged

## When to Use This Pattern

**Use wrapper layers when:**
- Legacy code has a poor interface but works correctly
- Legacy code is used in many places (high risk to change)
- You need a modern interface for new code
- The legacy code is stable (few changes expected)

**Don't use wrapper layers when:**
- The legacy code is only used in one place (just fix it directly)
- The legacy code has bugs that need fixing anyway
- The overhead of two interfaces isn't worth it

## Further Reading

- "Working Effectively with Legacy Code" by Michael Feathers, Chapter 13
- "Design Patterns" by Gang of Four - Adapter Pattern
- The wrapper can gradually replace legacy code (combine with Strangler Fig)
