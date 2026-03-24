# Demo 8: Standards & Skills

## Goal

Demonstrate the principle of **descriptive before prescriptive** — first understand what conventions actually exist in the codebase, then codify them. AI can surface tribal knowledge and de facto standards that aren't written down anywhere.

## Duration

~5-6 minutes

## Setup

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Ask Claude Code to Analyze Conventions

Use this prompt:

```
Analyze this codebase and describe the de facto coding conventions. Look at:
- Naming conventions (camelCase, snake_case, PascalCase — where is each used?)
- Indentation and formatting (spaces vs tabs, semicolons vs no semicolons)
- Module system (require vs import, module.exports vs export)
- TypeScript patterns (how `any` is used, type annotations, strict mode)
- Error handling patterns (try/catch, callbacks, .catch, error middleware)
- Variable declarations (var vs let vs const)
- Comment styles and documentation patterns
- File naming conventions
- API response formats
Don't judge — just describe what exists. I want to understand the current state before deciding what to change.
```

### Step 2: Review the Analysis

Claude Code should observe:
- **Mixed naming**: camelCase in JS, snake_case in SQL/DB fields, inconsistent between files
- **Mixed module systems**: `require`/`module.exports` in `.js`, `import`/`export` in `.ts`
- **Mixed semicolons**: Some files use them consistently, others are inconsistent
- **Liberal `any`**: TypeScript files use `any` for db, req, res, err parameters
- **`var` in JS files**: Older `var` declarations, not `let`/`const`
- **Error handling**: try/catch with `console.log` in routes, one global handler in server.js
- **Inconsistent file types**: `.js` and `.ts` in the same directory for the same purpose
- **Comment styles**: Mix of `//`, `/* */`, TODO comments, commented-out code
- **API responses**: No consistent envelope (some return arrays, some return objects with data)

### Step 3: Ask Claude Code to Generate a Standards Document

Use this prompt:

> Based on your analysis, generate a CLAUDE.md or coding standards file that describes these conventions as rules. This should be descriptive (what the codebase does now), not aspirational (what it should do). The goal is to ensure consistency with the existing patterns when making changes.

> Which of these instructions can be deterministically applied with claude code hooks?

### Step 4: Discussion

Review the generated standards document with the audience:
- Does it accurately reflect the codebase?
- How would this help a new developer?
- How would this help AI tools make consistent changes?
- When should we move from "descriptive" to "prescriptive"?

## Takeaway

**Descriptive before prescriptive** — understand what exists before mandating change. AI can surface tribal knowledge and de facto standards that aren't documented. A standards document based on reality (not aspirations) is immediately useful for onboarding and consistency.

## What the Audience Learns

- The difference between descriptive and prescriptive standards
- How AI surfaces patterns humans take for granted
- The value of codifying existing conventions before changing them
- How CLAUDE.md / skills files help AI tools make consistent changes
- That inconsistency itself is a pattern worth documenting
