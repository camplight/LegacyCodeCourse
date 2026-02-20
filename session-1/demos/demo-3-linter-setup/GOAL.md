# Demo 3: Linter Setup

## Goal

Demonstrate how AI helps with the **triage process** of adding a linter to a legacy codebase — not by fixing everything, but by reasoning about which violations are safe to touch, which to suppress, and which rules to disable entirely.

## Duration

~5-6 minutes

## Setup

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Ask Claude Code to Add ESLint

Use this prompt:

> Add ESLint to this project with a reasonable configuration for a Node.js/Express app that uses both JavaScript and TypeScript. Don't fix any violations yet — just set up the config.

Let Claude Code:
- Install eslint and relevant plugins
- Create `.eslintrc.json` (or similar)
- Configure for mixed JS/TS, Node environment
- Add an `npm run lint` script

### Step 2: Run ESLint and Observe the Volume

```bash
npm run lint
```

Expect a **large number** of errors and warnings. The codebase intentionally has:
- Inconsistent semicolons
- `var` instead of `let`/`const`
- `any` types in TypeScript
- Unused variables
- `console.log` statements
- Missing return types
- Inconsistent naming

**Discuss with audience**: This is what happens when you add a linter to a legacy codebase. Fixing everything is not realistic.

### Step 3: Ask Claude Code to Triage

Use this prompt:

> Look at the ESLint results. Categorize the violations into three groups:
> 1. **Safe auto-fixes**: Rules where `--fix` can be applied safely (formatting, semicolons, etc.)
> 2. **Suppress with comments**: Violations that are intentional or too risky to change right now — add `eslint-disable` comments
> 3. **Turn off for legacy**: Rules that generate too much noise for this codebase and should be disabled in the config
>
> Explain your reasoning for each category.

Let Claude Code analyze and propose the triage plan. Discuss the reasoning with the audience.

### Step 4: (Optional) Apply Safe Auto-fixes

```bash
npx eslint --fix src/
```

Show that the safe fixes reduce the error count significantly without changing behavior.

## Takeaway

Linting legacy code is **triage, not fix-everything**. AI helps reason about which violations are safe to touch vs. which need to be suppressed or ignored. This is a practical, realistic approach to incrementally improving code quality.

## What the Audience Learns

- How to introduce a linter to a legacy codebase without disruption
- The three-tier triage approach: auto-fix, suppress, disable
- How AI reasons about code safety and risk
- That "zero lint errors" is not a realistic immediate goal for legacy code
