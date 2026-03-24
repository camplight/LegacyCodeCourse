# Demo 7: Security Audit

## Goal

Demonstrate that not everything needs AI — `npm audit` is a purpose-built tool for dependency vulnerabilities. AI adds value in **interpretation, prioritization**, and finding **code-level security issues** that automated tooling misses.

## Duration

~5-6 minutes

## Setup

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Run npm audit Directly

```bash
npm audit
```

**Don't use AI for this step** — it's a purpose-built tool.

Observe the output:
- Multiple vulnerabilities at various severity levels
- `marked@0.7.0` — XSS and ReDoS vulnerabilities
- `lodash@4.17.15` — prototype pollution
- `jsonwebtoken@8.5.1` — various issues
- `moment@2.29.1` — deprecated, path traversal
- `uuid@3.4.0` — deprecated, weak randomness
- `node-fetch@2.6.1` — various issues

**Discuss**: This output is factual, exhaustive, and deterministic. AI doesn't improve on this.

### Step 2: Ask Claude Code to Interpret and Prioritize

Use this prompt:

```
I just ran `npm audit` and got these results. Help me:

  1. Prioritize which vulnerabilities to fix first based on actual exploitability in this codebase
  2. Identify which can be fixed with simple version bumps vs. which require code changes
  3. Also scan the source code for security issues that `npm audit` wouldn't catch
```

### Step 3: Observe AI's Code-Level Findings

Claude Code should find issues that `npm audit` cannot:
- **SQL injection** in `src/routes/reports.js` — the `tickets-by-date` endpoint uses string concatenation with user input
- **Hardcoded API key** in `src/middleware/auth.js` — `bugbase-secret-key-2024` in source code
- **Weak password hashing** in `src/routes/users.ts` and `src/seed.ts` — MD5 hashing (not bcrypt/argon2)
- **No CSRF protection** — no CSRF tokens on any endpoints
- **No rate limiting** — all endpoints exposed without throttling
- **Auth bypass in development** — unauthenticated access allowed when `NODE_ENV !== 'production'`
- **JWT tokens not validated** — `middleware/auth.js` accepts any non-empty Bearer token

### Step 4: Discussion

Contrast the two approaches:
- `npm audit`: dependency vulnerabilities, automated, deterministic
- AI scan: code-level issues, contextual, requires judgment
- Both are needed; neither replaces the other

## Takeaway

**Not everything needs AI.** `npm audit` is purpose-built and does its job perfectly. AI adds value in **interpretation** (which vulns matter for this specific codebase?) and **code-level analysis** (finding issues that dependency scanning can't).

## What the Audience Learns

- When to use purpose-built tools vs. AI
- The difference between dependency vulnerabilities and code-level security issues
- How to prioritize security fixes by exploitability
- Common code-level security anti-patterns (SQL injection, hardcoded secrets, weak hashing)
