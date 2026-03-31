# Demo 2: Isolate-and-Build — Adding Notification Preferences

## Scenario

Product wants **notification preferences** — patients should choose how they're notified about appointments (email, SMS, both, or none).

The feature naturally touches `notification-service.ts`, but this module is **too risky to refactor right now** (0% test coverage, 55% bug ratio — highest in the system, random failures, hardcoded credentials).

## Approach: Sprout Class Pattern

When you **can't** refactor, use an isolation pattern from session-2:

1. **Analyze** the risky module — understand why it's dangerous to touch
2. **Choose** the right isolation pattern
3. **Build** the new functionality in a clean, well-tested new module
4. **Integrate** with a single, minimal touchpoint

## Steps

### Step 1: Explore and Assess Risk

```
I need to add notification preferences to this system. Look at the notification service and tell me - should I refactor it first, or is that too risky?
```

**What the AI should surface on its own:** The 0% coverage, the `Math.random()` failure simulation, the hardcoded SMTP credentials, the complete lack of error handling. It should conclude that modifying this module directly is high-risk.

**Discussion point:** Given 0% coverage and 55% bug ratio, would you refactor this first? What could go wrong?

### Step 2: Choose the Pattern

Discuss with the audience (or let the AI suggest):

```
What's the safest way to add notification preferences without modifying the notification service at all?
```

**What the AI should recommend:** A Sprout Class pattern — build a new independent module for preferences, integrate at a single point. It might also mention Wrap Class or Branch by Abstraction; use that as a teaching moment for why Sprout Class is the best fit here.

### Step 3: TDD the Notification Preference Manager

```
Build a notification preferences module using TDD. It should be completely independent of the existing notification service. Patients can choose: email only, SMS only, both, or none. Use TDD (tests first, then make them pass).
```

**What the AI should handle:** Designing the API (get/set preferences, check if a channel should be used, default to "both"), writing tests first, then implementing. Let it decide the function signatures and data storage approach.

### Step 4: Integrate with Minimal Change

```
Now integrate notification preferences into the appointment flow.
Do not modify notification-service.ts — that's the risky module we're avoiding.
```

**What the AI should figure out:** That the integration point is in `appointment-scheduler.ts` (where notifications are triggered), and that it needs to check preferences before calling the send functions. It should also add API endpoints for managing preferences.

**Verification moment:** Run `git diff src/notification-service.ts` at the end — it should show nothing. That's the payoff.

## Expected Results

After completing this demo:
- New `notification-preferences.ts` with full test coverage
- New `notification-preferences.test.ts` with comprehensive tests
- `notification-service.ts` is **completely unchanged**
- Integration point is a small, readable change in `appointment-scheduler.ts`
- API endpoints for managing preferences

## Key Takeaway

> When you **can't** refactor, isolation patterns let you build high-quality new code while leaving legacy untouched. The Sprout Class pattern is your friend: new module, full tests, one-line integration. Session-2 patterns are practical tools, not just theory.
