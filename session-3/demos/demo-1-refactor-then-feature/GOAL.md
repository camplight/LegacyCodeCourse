# Demo 1: Refactor-Then-Feature — Adding Recurring Appointments

## Scenario

Product wants **recurring appointments** — patients should be able to book weekly checkups, monthly follow-ups, etc. The feature naturally belongs in `appointment-scheduler.ts`, which is the messiest module in the entire system (0% test coverage, 22 commits, 8 bug fixes). Handles validation, conflict detection, billing integration, notification sending, and caching — all in one file. Global mutable state, deep nesting, duplicated logic

## Approach: Characterize → Refactor → TDD

When you **can** invest in refactoring, the sequence is:

1. **Characterize** current behavior with tests
2. **Refactor** to clean up the code (all characterization tests stay green)
3. **TDD** the new feature on top of the cleaned-up code

AI accelerates every step.

## Steps

### Step 1: Explore the Code

```
We need to add a "recurring appointments" feature to this system.
Before we start, review the appointment scheduling code and tell me what I'm dealing with. How bad is it?
```

**What the AI should surface on its own:** The multiple responsibilities crammed into one file, duplicated validation, global mutable state, tight coupling to billing and notifications, magic numbers. If it doesn't flag something, ask a follow-up — but let it lead.

**Discussion point:** How many responsibilities does this one file have? What would "clean" look like?

### Step 2: Write Characterization Tests

Use the `/characterize` slash command (copied from session 2):

```
/characterize the appointment scheduling API endpoints (use Supertest)
```

This runs our structured characterization testing workflow: it catalogs entry points by risk, traces data flows, documents behavior (including bugs), and writes tests that lock current behavior. The command handles test design rules, nondeterminism control, and sensitivity checks.

**Goal:** Every characterization test passes. This is the safety net for refactoring.

### Step 3: Refactor

With characterization tests in place:

```
Now refactor appointment-scheduler.ts to separate its concerns.
Extract into well-named functions but keep everything in the same file.
Keep all characterization tests green after each change.
```

**What the AI should do:** Identify the extraction boundaries itself — validation logic, conflict detection, billing integration, notification dispatch. The key principle is small, incremental extractions with tests running after each one.

If it tries to do everything at once, steer it: *"Do one extraction at a time and run tests between each."*

### Step 4: TDD the Recurring Appointments Feature

Now the code is clean enough to add the feature properly:

```
Add recurring appointments — patients should be able to book weekly or monthly repeating appointments. Write the tests first, then implement to make them pass.
```

**What the AI should handle:** Designing the test cases (create series, cancel single occurrence vs. whole series, conflict detection across occurrences, skipping days the doctor doesn't work) and then implementing the feature.

## Expected Results

After completing this demo:
- `appointment-scheduler.ts` has clear internal structure (extracted functions)
- All original characterization tests still pass
- New recurring appointment feature works with full test coverage
- The module is easier to understand and modify

## Key Takeaway

> When you CAN invest in refactoring, the sequence is: **characterize → refactor → TDD**. AI accelerates each step — generating characterization tests in minutes, suggesting refactoring patterns, and scaffolding TDD cycles.
