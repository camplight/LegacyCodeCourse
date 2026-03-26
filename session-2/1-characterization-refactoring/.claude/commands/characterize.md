# Characterization Testing — $ARGUMENTS

## Goal

Create characterization tests for **$ARGUMENTS** that lock current externally
observable behavior. These tests are a safety net for future refactors.
Do not modify production code.

## Success Criteria

- All high-risk entry points for $ARGUMENTS are cataloged and tested
  (or explicitly marked unreachable with a reason).
- Tests assert current behavior (including quirks/bugs) and are deterministic.
- Test suite is stable (passes repeatedly) and suitable as a no-regression gate
  for refactors.

## Process

### 1. Scope & Risk Prioritization

- Identify entry points and rank by breakage risk:
  - Public APIs / routes / CLI commands
  - Persistence and side effects (DB writes, queues, files, emails)
  - Security/authz, billing/money, migrations/data transforms
- Start with highest-risk items first. If time or context is limited, the most
  critical behaviors must be covered before lower-risk ones.

### 2. Explore Current Behavior

- Trace data flow from each selected entry point.
- Identify dependencies (DB, network, filesystem, env vars, time/randomness).

### 3. Behavior Catalog (before writing any tests)

For each entry point, list:

- Happy-path behavior
- Edge/boundary behavior (systematically derived from conditionals, switch
  statements, type guards, and default branches in the code)
- Error behavior
- Side effects and emitted events/logs
- Known nondeterminism sources (time, random, ordering, generated IDs)

This catalog is a deliverable — it documents actual system behavior and should
be kept alongside the tests as a reference, not discarded after test planning.

### 4. Test Design Rules

- Assert on externally observable results (status codes, return values,
  persisted state, emitted messages, written files). Don't assert on how
  the code internally achieves them.
- Use descriptive test names tied to behavior:
  `it("returns 0 when input list is empty")` not `it("works")`
- If behavior appears buggy, keep the assertion as-is and tag:
  `// NOTE: possible bug (characterized intentionally) — [description]`
- For large structured outputs (JSON responses, HTML, CLI output), use
  snapshot / golden-file / approval tests with normalization rules rather
  than hand-written field-by-field checks.

### 5. Control Nondeterminism

- Freeze/seed time, random, timezone/locale.
- Normalize unstable fields (timestamps, UUIDs, ordering) before
  assertions/snapshots.
- Never write a test that can flake.

### 6. Implement Tests

- Prefer real code paths and realistic fixtures.
- Mock only true externals that cannot be run locally (third-party APIs,
  payment gateways, etc.). Prefer ephemeral real infra or local containers
  over mocks where feasible. Document each mock and why it was necessary.
- Work incrementally: write tests for one entry point, run them green,
  then proceed to the next. Do not write the entire suite before running
  anything.
- Place characterization tests in a clearly separated location (e.g.,
  `__characterization__/` directory or files named `*.characterization.test.*`)
  so they are easy to identify and eventually replace with intent-based tests.

### 7. Validate Reliability

- Run tests multiple times (or with shuffled order) to catch flakiness.
- Confirm behavior catalog mapping:
  - `[x]` tested
  - `[ ]` untested + reason (unreachable, unsafe, missing fixture, etc.)

### 8. Sensitivity Spot-Check

- Pick 2-3 key tests. Temporarily change the production code's return value
  or a conditional. Confirm the test fails. Revert the change immediately.
- This guards against vacuous assertions (e.g., `expect(result).toBeDefined()`)
  that pass regardless of actual behavior.

## Constraints

- Do NOT modify production code (logic, naming, formatting, or refactors).
- Do NOT change behavior to make tests pass.
- Do NOT encode "desired" behavior; encode observed behavior only.
- Keep helpers/fixtures minimal and co-located with tests.
- Follow existing project test framework/conventions; if absent, ask before
  choosing.

## Output

When done, provide:

1. **Behavior Catalog Checklist** — grouped by entry point, checked = covered.
   This catalog serves as living documentation of actual system behavior.
2. **Characterized Quirks / Suspected Bugs** — with `file:line` references
3. **Untested Paths** — rationale + what would be needed to test them
4. **Determinism Controls Used** — time/random/order/locale handling
5. **Mocking Decisions** — what was mocked and why
6. **Sensitivity Check Results** — which mutations were tried, which tests
   caught them
7. **Baseline Snapshot** — recorded test output that can be diffed against
   future runs to detect behavior changes after a refactor
8. **Refactor Gate Recommendation** — which tests should be mandatory in CI
   before any refactor lands
