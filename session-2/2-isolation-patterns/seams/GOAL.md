# Seams Pattern (Object Seams / Dependency Injection)

## What is This Pattern?

A seam is a place in code where you can change behavior without modifying the code itself. Object seams use interfaces and dependency injection to create points where different implementations can be plugged in. This makes code testable and flexible without requiring changes to core business logic.

## The Problem

The legacy `OrderProcessor` has a critical testability problem:

```typescript
processOrder(order: Order): void {
  // ... business logic ...

  const emailer = new EmailService();  // ← Direct instantiation!
  emailer.sendEmail(order.customerEmail, subject, body);
}
```

**Issues:**
- **Impossible to test** - Every test sends real emails via SMTP
- **Tight coupling** - Directly depends on `EmailService` implementation
- **Hard-coded behavior** - No way to change notification method
- **No abstraction** - Can't add SMS, Slack, or other notification types

**New Requirement**: Send SMS notifications for high-value orders (>£500) in addition to email, while keeping email for all orders.

**The Catch**: We can't modify the core business logic in `processOrder()` - it's fragile and well-tested in production.

## The Solution

Create a seam using an interface and dependency injection:

1. **Define interface** - `INotificationService` abstracts notification behavior
2. **Implement interface** - Multiple implementations (Email, SMS, Composite)
3. **Inject dependency** - Pass implementation via constructor
4. **Zero business logic changes** - `processOrder()` method unchanged

The seam is the constructor parameter - behavior changes by passing different implementations.

## Files in This Example

- **before.ts** - Tightly coupled code with direct instantiation (untestable)
- **after.ts** - Code with seams:
  - `INotificationService` interface (the seam)
  - `EmailNotificationService`, `SmsNotificationService`, `CompositeNotificationService` (implementations)
  - `OrderProcessor` with dependency injection (testable)
- **after.test.ts** - Tests using mock implementation (no side effects)

## Running the Example

```bash
npm install
npm test
```

## Key Learning Points

1. **Interface creates seam** - The `INotificationService` interface is the point where behavior can change
2. **Dependency injection enables seam** - Constructor injection makes the seam usable
3. **Business logic unchanged** - Zero changes to `processOrder()` method, just uses injected service
4. **Easy testing** - Mock implementation allows testing without side effects
5. **Easy extension** - Add new notification types without modifying existing code

## The Power of Seams

**Before** (Tightly Coupled):
```typescript
class OrderProcessor {
  processOrder(order) {
    const emailer = new EmailService();  // Hard-coded!
    emailer.sendEmail(...);
  }
}

// Testing requires sending real emails - impossible!
```

**After** (With Seam):
```typescript
class OrderProcessor {
  constructor(private notifier: INotificationService) {}  // ← Seam!

  processOrder(order) {
    this.notifier.send(...);  // Same code, different behavior
  }
}

// Testing uses mock - no side effects!
const processor = new OrderProcessor(new MockNotifier());
```

## Exercise

Your task: Add a new notification type - **Slack notifications** - for internal team alerts when orders exceed £1000.

Requirements:
1. Create `SlackNotificationService` implementing `INotificationService`
2. Modify `NotificationFactory` to return a composite that includes:
   - Email (all orders)
   - SMS (orders > £500)
   - Slack (orders > £1000)
3. Write tests for your new service using mocks
4. **Constraint**: Do NOT modify the `OrderProcessor.processOrder()` method

Hints:
- The interface is your seam - implement it
- Use `CompositeNotificationService` to combine multiple notifications
- Test using a mock Slack service

## Further Reading

- "Working Effectively with Legacy Code" by Michael Feathers, Chapter 4: "The Seam Model"
- Martin Fowler's ["Dependency Injection" article](https://martinfowler.com/articles/injection.html)
