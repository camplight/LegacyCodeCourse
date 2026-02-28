# Demo 1: Refactor-Then-Feature — Adding Recurring Appointments

## Scenario

Product wants **recurring appointments** — patients should be able to book weekly checkups, monthly follow-ups, etc. The feature naturally belongs in `appointment-scheduler.ts`, which is the messiest module in the entire system:

- ~230 lines, complexity 20
- 0% test coverage
- 22 commits, 8 of which were bug fixes (36% bug ratio)
- Handles validation, conflict detection, billing integration, notification sending, and caching — all in one file
- Global mutable state, deep nesting, duplicated logic

## Approach: Characterize → Refactor → TDD

When you **can** invest in refactoring, the sequence is:

1. **Characterize** current behavior with tests
2. **Refactor** to clean up the code (all characterization tests stay green)
3. **TDD** the new feature on top of the cleaned-up code

AI accelerates every step.

## Steps

### Step 1: Explore the Code

Ask Claude Code to read and analyze `appointment-scheduler.ts`:

```
Read src/appointment-scheduler.ts and identify:
- All distinct responsibilities this module handles
- Where validation logic is duplicated
- All external dependencies (imports from other modules)
- Global mutable state
- Magic numbers
```

**Discussion point:** How many responsibilities does this one file have? What would "clean" look like?

### Step 2: Write Characterization Tests

Ask Claude Code to generate black-box HTTP tests using Supertest that capture the current behavior of the appointment scheduling system. These tests should cover:

- **Happy paths:** Create appointment, reschedule, cancel, complete, mark no-show
- **Validation:** Missing patient, missing doctor, past date, invalid type, invalid duration, outside business hours
- **Conflict detection:** Double-booking a doctor, double-booking a patient, emergency override
- **Edge cases:** Cancel already-cancelled appointment, reschedule completed appointment

```
Write characterization tests for the appointment scheduling API endpoints.
Use Supertest against the Express app. The tests should capture CURRENT
behavior — don't fix bugs, just document what the system does today.

Before each test, you'll need to:
1. Reset all data stores (_resetAppointmentData, _resetPatientData, etc.)
2. Create test doctors with schedules
3. Create test patients

Cover: create, reschedule, cancel, complete, no-show, conflicts, validation.
```

**Goal:** These tests are your safety net. Every test should pass before AND after refactoring.

### Step 3: Refactor

With characterization tests in place, ask Claude Code to refactor `appointment-scheduler.ts`:

```
Refactor appointment-scheduler.ts by extracting these concerns into
separate functions (keep them in the same file for now):

1. Appointment validation (date, time, type, duration, business hours)
2. Conflict detection (doctor conflicts, patient conflicts, emergency override)
3. Billing integration (create invoice, cancel invoice, update invoice)
4. Notification dispatch (confirmation, cancellation)

Keep all characterization tests green after each extraction.
```

**Key principle:** Small, incremental extractions. Run tests after each change.

### Step 4: TDD the Recurring Appointments Feature

Now write tests FIRST for the new feature, then implement:

```
Write tests for a new "recurring appointments" feature:
- Create a recurring appointment (weekly for 4 weeks)
- Create a recurring appointment (monthly for 3 months)
- Cancel a single occurrence (others remain)
- Cancel the entire series
- Conflict detection for recurring appointments
- Skip dates that fall on days the doctor doesn't work

Then implement the feature to make all tests pass.
```

## Expected Results

After completing this demo:
- `appointment-scheduler.ts` has clear internal structure (extracted functions)
- All original characterization tests still pass
- New recurring appointment feature works with full test coverage
- The module is easier to understand and modify

## Key Takeaway

> When you CAN invest in refactoring, the sequence is: **characterize → refactor → TDD**. AI accelerates each step — generating characterization tests in minutes, suggesting refactoring patterns, and scaffolding TDD cycles.
