# Demo 1: Test Evaluation Tool

## Goal

Demonstrate how AI can generate **reusable, deterministic analysis tools** instead of one-off answers. We ask Claude Code to create a script that evaluates the test suite — then run it and discuss the findings.

## Duration

~5-6 minutes

## Setup

Ensure you're in the `legacy-app/` directory with dependencies installed:

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Ask Claude Code to Generate the Tool

Use this prompt (or similar):

```
Generate a script called `evaluate-tests.js` that analyzes the test suite of this project. It should:
- Find all test files in the project
- Map which source files have corresponding tests and which don't
- Detect the test framework and check its configuration
- Find skipped/pending tests
- Count test cases per file
- Check for coverage configuration
- Output a structured JSON report to stdout
```

Let Claude Code explore the codebase and generate the script.

### Step 2: Run the Generated Tool

```bash
node evaluate-tests.js
```

Review the JSON output together with the audience.

### Step 3: Discuss Findings

The tool should discover:
- Only 2 test files exist (`test/tickets.test.js`, `test/helpers.test.js`)
- No tests for: users, projects, reports, auth, database, seed
- 1 skipped test (the DELETE test in tickets)
- Jest is the framework, configured in `package.json`
- No coverage configuration
- No integration tests, no error path tests
- `helpers.test.js` only tests 2 of ~8 exported helpers

### Step 4: Key Point

**Run the script a second time** — it produces identical output. Compare this to asking an LLM the same question twice, which would give different phrasing and possibly miss things.

## Takeaway

AI generates **reusable, deterministic analysis tools** — not one-off answers. The script can be run again after changes, shared with the team, added to CI. This is a fundamentally different way to use AI than asking questions.

## What the Audience Learns

- How to prompt for tool generation vs. asking for analysis
- The value of deterministic, repeatable output over generative answers
- How to evaluate test coverage gaps systematically
