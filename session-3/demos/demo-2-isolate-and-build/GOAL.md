# Demo 2: Isolate-and-Build — Adding Notification Preferences

## Scenario

Product wants **notification preferences** — patients should choose how they're notified about appointments:
- Email only
- SMS only
- Both email and SMS
- None (opt out)

The feature naturally touches `notification-service.ts`, but this module is **too risky to refactor right now**:

- 0% test coverage
- 18 commits, 10 of which were bug fixes (55% bug ratio — highest in the system)
- Random failure simulation (`Math.random() < 0.1`)
- Hardcoded SMTP credentials
- No error handling, no retry logic

## Approach: Sprout Class Pattern

When you **can't** refactor, use an isolation pattern from session-2:

1. **Analyze** the risky module — understand why it's dangerous to touch
2. **Choose** the right isolation pattern (Sprout Class fits perfectly here)
3. **Build** the new functionality in a clean, well-tested new module
4. **Integrate** with a single, minimal touchpoint in the existing code

## Steps

### Step 1: Explore and Assess Risk

Ask Claude Code to analyze `notification-service.ts`:

```
Read src/notification-service.ts and assess:
- Why is this module risky to modify? (Consider: test coverage, bug ratio, hardcoded values)
- What are the failure modes? (Random failures, missing error handling)
- Where would notification preferences naturally integrate?
- What's the minimal change needed to add preference checking?
```

**Discussion point:** Given 0% coverage and 55% bug ratio, would you refactor this first? What's the risk?

### Step 2: Choose the Pattern

Discuss why Sprout Class is the right pattern here:

- **Sprout Class:** Create a brand-new module (`notification-preferences.ts`) that handles ALL preference logic. The legacy module only needs ONE new call — "should I send to this patient?"
- **Why not Wrap Class?** We're not modifying the existing behavior, just adding a routing layer before it.
- **Why not Branch by Abstraction?** Too heavy — we don't need to replace the notification service, just add preference filtering.

### Step 3: TDD the Notification Preference Manager

Ask Claude Code to build the new module with tests first:

```
Create a new module src/notification-preferences.ts using TDD.
This is a Sprout Class — it should be completely independent of
notification-service.ts.

The module should:
1. Store notification preferences per patient (email, sms, both, none)
2. Default to 'both' for patients without a preference set
3. Provide a function to check if a specific channel should be used
4. Provide a function to get a patient's preference
5. Provide a function to set a patient's preference

Write the tests first in tests/notification-preferences.test.ts,
then implement the module.
```

### Step 4: Integrate with Minimal Change

The integration point should be ONE function call. Ask Claude Code:

```
Add notification preference checking to the appointment scheduling flow.

The change should be minimal:
- In appointment-scheduler.ts, before calling notification functions,
  check the patient's notification preferences
- If preference is 'none', skip notifications entirely
- If preference is 'email', only send email
- If preference is 'sms', only send SMS
- If preference is 'both' (default), send both as today

This should be 5-10 lines of change at most, in one location.
Do NOT modify notification-service.ts at all.
```

Also add an API endpoint for managing preferences:

```
Add these routes to server.ts:
- GET /api/patients/:id/notification-preferences
- PUT /api/patients/:id/notification-preferences
```

## Expected Results

After completing this demo:
- New `notification-preferences.ts` with full test coverage
- New `notification-preferences.test.ts` with comprehensive tests
- `notification-service.ts` is **completely unchanged**
- Integration point is a small, readable change in `appointment-scheduler.ts`
- API endpoints for managing preferences

## Key Takeaway

> When you **can't** refactor, isolation patterns let you build high-quality new code while leaving legacy untouched. The Sprout Class pattern is your friend: new module, full tests, one-line integration. Session-2 patterns are practical tools, not just theory.
