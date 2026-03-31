---
name: test-priority
description: >
  Generate data-driven test prioritization scripts that analyze coverage gaps
  and git history to rank which files need tests most urgently. Use this skill
  when the user wants to know where to focus testing effort, asks about test
  coverage strategy, wants to prioritize which code to test first, or mentions
  anything about test gaps, coverage analysis, or change-risk scoring — even if
  they don't use the word "priority."
---

# Test Coverage Strategy — $ARGUMENTS

## Goal

Generate reusable analysis scripts for **$ARGUMENTS** that answer "which files
should be tested first?" with data, not guesswork. The scripts combine test
coverage gaps with git history (change frequency, bug-fix ratio) to produce a
ranked priority list.

The scripts are the primary deliverable — they live in the project and can be
re-run as the codebase evolves, giving the team a continuous signal on where
testing effort has the highest payoff.

## Success Criteria

- Three standalone scripts generated in `scripts/`:
  1. `analyze-test-gaps.js` — coverage analysis
  2. `analyze-change-risk.js` — git history risk analysis
  3. `prioritize-testing.js` — combined prioritized ranking
- Each script runs independently with `node scripts/<name>.js`
- Scripts produce clear, formatted console output (tables, not raw JSON)
- The combined prioritizer's ranking is explainable — the formula is visible
  in the code and the output shows the contributing factors, not just a score

## Process

### 1. Verify Prerequisites

Before generating anything, confirm:
- The project uses Jest (check `package.json` for jest dependency or config)
- Jest coverage is configured or can be run with `--coverage`
- The project has meaningful git history (at least 20+ commits). If not,
  warn that change-risk analysis will be unreliable and offer to skip it.
- A `scripts/` directory exists or can be created

If Jest is not the test runner, stop and tell the user — this skill currently
supports Jest only.

### 2. Generate Test Gap Analyzer (`scripts/analyze-test-gaps.js`)

This script answers: **which files have the worst test coverage?**

The script should:
- Run Jest with `--coverage --coverageReporters=json-summary` programmatically
  or parse the coverage output
- Read the coverage summary JSON from the Jest coverage output directory
- Extract per-file coverage percentages (statements, branches, functions, lines)
- Sort files by coverage ascending (worst coverage first)
- Print a formatted table:

```
File                        Stmts    Branch   Funcs    Lines
─────────────────────────────────────────────────────────────
appointment-scheduler.ts     0.0%     0.0%    0.0%     0.0%
notification-service.ts      0.0%     0.0%    0.0%     0.0%
reporting.ts                 0.0%     0.0%    0.0%     0.0%
patient-registry.ts         44.2%    33.3%   50.0%    44.2%
billing-service.ts          57.1%    50.0%   66.7%    57.1%
```

Implementation notes:
- Use `child_process.execSync` to run Jest — keep it simple, no async needed
- Strip the project root from file paths so the table is readable
- Exclude test files, config files, and `node_modules` from the report
- Handle the case where Jest coverage output doesn't exist yet (first run)

### 3. Generate Change Risk Analyzer (`scripts/analyze-change-risk.js`)

This script answers: **which files change the most and have the most bugs?**

The script should:
- Parse git log to count commits per source file:
  `git log --pretty=format:"%H %s" --name-only`
- Use conventional commit prefixes to classify commits:
  - `fix:`, `bugfix:`, `hotfix:` → bug-fix commit
  - Everything else → regular change
- Calculate per file:
  - Total commits (change frequency)
  - Bug-fix commits
  - Bug ratio (bug-fix commits / total commits)
- Sort by bug-fix count descending, then by total commits descending
- Print a formatted table:

```
File                        Changes   Bug Fixes   Bug Ratio
─────────────────────────────────────────────────────────────
notification-service.ts        18        10         55.6%
appointment-scheduler.ts       22         8         36.4%
billing-service.ts             10         4         40.0%
patient-registry.ts            12         3         25.0%
```

Implementation notes:
- Only include source files (`.ts`, `.js`, `.tsx`, `.jsx`), exclude tests,
  configs, and generated files
- The git log parsing should be robust — handle merge commits, multi-line
  messages, and files that have been renamed
- If the repository has very few commits, print a warning about reliability

### 4. Generate Combined Prioritizer (`scripts/prioritize-testing.js`)

This script answers: **given limited time, test these files first.**

The script should:
- Import or call the other two scripts' logic, or run them and parse output
  (either approach is fine — prefer whatever keeps the scripts independent)
- Combine coverage gaps with change risk using a transparent formula:

```
priority_score = (1 - coverage) × (changes + bugFixes × 2)
```

The formula's rationale: files with low coverage are risky because changes
aren't caught by tests. Files that change often and accumulate bugs are risky
because they're actively causing problems. Bug fixes are weighted 2× because
a file that keeps getting bug fixes is demonstrably unreliable.

- Sort by priority score descending
- Print a combined table showing all contributing factors:

```
Priority  File                       Coverage  Changes  Bugs   Score
──────────────────────────────────────────────────────────────────────
1         appointment-scheduler.ts     0.0%      22       8     38.0
2         notification-service.ts      0.0%      18      10     38.0
3         reporting.ts                 0.0%       8       2     12.0
4         patient-registry.ts         44.2%      12       3     10.0
5         billing-service.ts          57.1%      10       4      7.7
```

- Below the table, print a brief interpretation:
  - Top 3 files to prioritize and why
  - Any files with 0% coverage but low change frequency (low urgency)
  - Any files with high coverage but high bug ratio (tests may be low quality)

### 5. Verify Scripts Work

After generating all three scripts:
- Run each one and confirm it produces output without errors
- Check that the prioritizer's ranking is reasonable given the coverage and
  git data
- If any script fails, fix it before moving on — the scripts are the
  deliverable, not the analysis

## Constraints

- Do NOT modify production code, test files, or project configuration.
- Scripts should be plain JavaScript (not TypeScript) so they run with
  `node` directly — no build step needed. They are tools, not application code.
- Scripts should have no external dependencies beyond Node.js built-ins and
  the project's existing Jest installation.
- Keep scripts self-contained and readable — they will be reviewed by the team
  and potentially modified. No cleverness, no abstraction. Straightforward
  procedural code.
- The priority formula must be visible in the source code with a comment
  explaining the rationale. The team should be able to adjust weights.

## Output

When done, provide:

1. **Scripts Created** — paths to the three generated scripts, with a
   one-line description of each
2. **Test Gap Report** — output of the coverage analyzer
3. **Change Risk Report** — output of the git history analyzer
4. **Priority Ranking** — output of the combined prioritizer
5. **Interpretation** — which files to test first and why, based on the data.
   Call out any surprises (e.g., high-coverage files with high bug ratios,
   zero-coverage files that rarely change)
6. **Next Steps** — concrete recommendation: "Run `/characterize` on
   `<top-priority-file>` to start adding characterization tests"
