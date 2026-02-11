# Isolation Patterns for Legacy Code

This directory contains four fundamental patterns from "Working Effectively with Legacy Code" by Michael Feathers. Each pattern demonstrates a technique for adding new features to legacy code safely, without modifying fragile existing code.

## The Patterns

### 1. Strangler Fig Pattern
**Directory:** `strangler-fig/`

**When to use:** You need to replace a legacy system with a modern one, but a "big bang" rewrite is too risky.

**How it works:** Build new functionality alongside the old system and route traffic incrementally from legacy to new code. Eventually, the legacy code can be removed.

**Key benefit:** Zero risk to existing customers. New system can be built with modern architecture while legacy continues working.

**Example:** E-commerce discount calculator transitioning from synchronous blocking code to async dynamic pricing.

---

### 2. Seams (Dependency Injection)
**Directory:** `seams/`

**When to use:** Code has tight coupling (direct instantiation) that makes testing impossible.

**How it works:** Create an interface and inject dependencies via constructor. This creates a "seam" where behavior can be changed without modifying the code.

**Key benefit:** Testability. Business logic can be tested with mock implementations instead of real dependencies (no side effects).

**Example:** Order processor that directly creates an EmailService, refactored to accept any INotificationService (email, SMS, Slack).

---

### 3. Sprout Classes
**Directory:** `sprout-classes/`

**When to use:** You need to add new functionality to a large, fragile class but modifying it directly is risky.

**How it works:** Create a new class to handle the new feature. The legacy class calls the new class at a single integration point.

**Key benefit:** New code is completely independent and testable. Legacy code barely changes (one method call added).

**Example:** Invoice generator needs tax calculation. Instead of modifying the complex generator, create a TaxCalculator sprout class.

---

### 4. Wrapper Layers (Adapter)
**Directory:** `wrapper-layers/`

**When to use:** Legacy code has a terrible interface (callbacks, poor naming, untyped data) but is used throughout the application.

**How it works:** Create a wrapper that provides a clean interface while internally using the legacy code. The wrapper translates between old and new interfaces.

**Key benefit:** New code gets a modern interface. Legacy code stays unchanged. Gradual migration possible.

**Example:** Legacy database layer with callbacks and snake_case wrapped with async/await and clean TypeScript types.

---

## Pattern Comparison

| Pattern | Risk Level | Testing Benefit | When to Use |
|---------|-----------|----------------|-------------|
| **Strangler Fig** | Very Low | High | Replacing entire systems |
| **Seams** | Low | Very High | Making code testable |
| **Sprout Classes** | Very Low | Very High | Adding features to fragile classes |
| **Wrapper Layers** | Low | High | Improving interfaces |

## Running the Examples

Each pattern is an independent npm package. To run an example:

```bash
cd [pattern-name]
npm install
npm test
```

To run all tests:

```bash
# From this directory
for dir in strangler-fig seams sprout-classes wrapper-layers; do
  echo "Testing $dir..."
  cd $dir && npm test && cd ..
done
```

## File Structure

Each pattern contains:
- **before.ts** - Legacy code with anti-patterns (intentionally messy)
- **after.ts** - Code transformed using the pattern
- **after.test.ts** - Tests demonstrating the pattern's benefits
- **GOAL.md** - Exercise instructions and learning points

## Learning Path

Recommended order:

1. **Seams** - Foundational concept for making code testable
2. **Sprout Classes** - Safe way to add features
3. **Wrapper Layers** - Improving interfaces
4. **Strangler Fig** - Gradual system replacement

## Common Themes

All patterns share these principles:

1. **Minimize changes to legacy code** - Reduce risk of breaking existing functionality
2. **Make new code testable** - Write comprehensive tests for new features
3. **Create clear separation** - Legacy and new code are clearly separated
4. **Enable gradual migration** - Patterns support incremental improvement
5. **Maintain working state** - System stays functional throughout transformation

## Further Reading

- "Working Effectively with Legacy Code" by Michael Feathers
  - Chapter 4: The Seam Model
  - Chapter 11: Sprout Method and Sprout Class
  - Chapter 13: Dependencies and Wrappers
  - Strangler Fig: Martin Fowler's blog

## Notes

This is training material for the Legacy Code Course. The "before" code is **intentionally messy** to demonstrate realistic legacy code challenges. The "after" code shows best practices for applying each pattern.
