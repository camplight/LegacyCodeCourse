# Exercise Goals: Characterization Testing & AI-Assisted Refactoring

## Overview

This exercise has TWO sequential goals that demonstrate a real-world workflow for transforming legacy code safely:

1. **First Goal**: Implement characterization tests that prevent regressions during refactoring
2. **Second Goal**: Use AI to refactor while keeping tests green

## Context

The `flight-booking-api.ts` file is intentionally messy legacy code (~600 lines) representing a realistic scenario:
- Single file containing all business logic
- Mixed concerns (HTTP, validation, business rules, data storage)
- Complex pricing calculations
- Deep nesting and duplicated logic
- Liberal use of `any` types
- Global mutable state

**The code WORKS** - it's a functional API, just poorly structured and hard to maintain.

## Goal 1: Write Characterization Tests

**What are characterization tests?**
Tests that document the EXISTING behavior of legacy code without changing it. They answer: "What does this code actually do right now?"

Prompt: `/characterize the /flights endpoint`

### Tasks:

1. **Explore the API** - use curl/Postman to understand what it does
2. **Write tests for existing behaviors** - not what it SHOULD do, but what it DOES
3. **Focus on observable behaviors through the API**:
   - Flight search with various parameters
   - Booking creation with valid/invalid data
   - Price calculations (different scenarios)
   - Cancellations and refund calculations
   - Edge cases and error conditions

### Teaching Points:

- **Characterization ≠ ideal behavior**: Tests document what code does NOW, bugs and all
- **Discovery process**: You will find unexpected behaviors/quirks
- **Safety net**: These tests prevent regression when refactoring
- **Black box testing**: Test through public API, not implementation details

## Goal 2: AI-Assisted Refactoring (AI Exercise)

Once characterization tests are in place and passing, use AI to refactor.

Prompt: `Refactor the flights endpoint towards hexagonal architecture. Do not touch the tests!`

### Tasks:

1. **Use AI to refactor the code** while keeping tests green
2. **Focus on structural improvements**:
   - Extract business logic from HTTP handlers
   - Separate concerns (validation, pricing, booking, storage)
   - Remove duplication
   - Improve naming and type safety
   - Break down large functions

3. **Verify continuously**:
   - Run tests after each refactoring step
   - Tests should continue passing WITHOUT modification
   - If tests fail, refactoring broke behavior

### Refactoring Opportunities to Discuss:

**Separation of Concerns:**
- HTTP layer (Express routes/handlers)
- Business logic (pricing, availability, booking rules)
- Data access (in-memory storage operations)
- Validation (input validation, business rules)

**Code Organization:**
- Multiple focused files instead of one large file
- Clear module boundaries
- Explicit dependencies

**Type Safety:**
- Replace `any` with proper types
- Use TypeScript features effectively
- Type definitions for domain models

**Code Quality:**
- Extract magic numbers to named constants
- Remove code duplication
- Reduce nesting depth
- Improve function names

### Success Criteria for Goal 2:

- [ ] All characterization tests still pass
- [ ] Code is organized into logical modules/files
- [ ] Business logic is separated from HTTP handling
- [ ] Type safety is improved (fewer/no `any` types)
- [ ] Functions are smaller and more focused
- [ ] Code is more maintainable and easier to understand
- [ ] No new functionality added (pure refactoring)

### Teaching Points:

- **Tests as safety net**: Can refactor confidently because tests catch breakages
- **Incremental changes**: Small refactorings, run tests frequently
- **Behavior preservation**: External behavior unchanged, internal structure improved
- **Red-green refactor**: If tests go red, revert or fix before continuing

## Expected Outcomes

After this exercise, students should:
- Understand what characterization tests are and why they're valuable
- Be comfortable exploring legacy code through testing
- Know how to use tests as a safety net for refactoring
- Have experience with AI-assisted refactoring
- Appreciate the importance of behavior preservation
- Understand the difference between refactoring and adding features
