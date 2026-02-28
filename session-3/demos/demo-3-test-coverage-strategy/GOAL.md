# Demo 3: Test Coverage Strategy — Micro-tools for Prioritization

## Scenario

The team wants to gradually add tests to ClinicFlow. With limited time, **which files should be tested first?** Instead of guessing, we'll generate micro-tools that answer this question with data.

## Approach: Generate Analysis Micro-tools

We'll create three small scripts that analyze the codebase and produce a prioritized testing plan:

1. **Test gap analyzer** — Which files have low/no coverage?
2. **Change risk analyzer** — Which files change most and have the most bugs?
3. **Priority calculator** — Combine both into a ranked recommendation

## Steps

### Step 1: Generate the Test Gap Analyzer

```
Create scripts/analyze-test-gaps.js — a Node.js script that:

1. Runs Jest with --coverage --json flags to get coverage data
2. Reads the coverage JSON output
3. For each source file, extracts: statements %, branches %, functions %, lines %
4. Identifies files with 0% coverage (no tests at all)
5. Outputs a table sorted by coverage (lowest first):

   File                       Stmts%  Branch%  Funcs%  Lines%
   ──────────────────────────────────────────────────────────
   appointment-scheduler.ts    0%      0%       0%      0%
   notification-service.ts     0%      0%       0%      0%
   reporting.ts                0%      0%       0%      0%
   patient-registry.ts         57%     68%      50%     57%
   billing-service.ts          85%     59%      93%     86%
   ...

The script should work by running: node scripts/analyze-test-gaps.js
```

### Step 2: Run and Discuss

Run the script and discuss what the output tells us:
- Three files have 0% coverage — are they all equally important to test?
- Some files have decent coverage — where are the gaps?
- Coverage alone doesn't tell the whole story — what's missing?

### Step 3: Generate the Change Risk Analyzer

```
Create scripts/analyze-change-risk.js — a Node.js script that:

1. Runs git log to get per-file commit history
2. For each source file, calculates:
   - Total commits
   - Bug-fix commits (messages starting with "fix:")
   - Feature commits (messages starting with "feat:")
   - Bug ratio (bug-fix commits / total commits)
3. Outputs a table sorted by total changes (highest first):

   File                       Commits  Bug Fixes  Bug Ratio
   ─────────────────────────────────────────────────────────
   appointment-scheduler.ts    22       8          36%
   notification-service.ts     18       10         55%
   patient-registry.ts         12       3          25%
   billing-service.ts          10       4          40%
   ...

The script should work by running: node scripts/analyze-change-risk.js
```

### Step 4: Run and Discuss

Run the script and discuss:
- `notification-service.ts` has the highest bug ratio (55%) — it's the most error-prone
- `appointment-scheduler.ts` has the most commits — it changes the most
- Which metric matters more for testing priority?

### Step 5: Generate the Combined Prioritizer

```
Create scripts/prioritize-testing.js — a Node.js script that:

1. Runs both analyze-test-gaps.js and analyze-change-risk.js (or reads their data)
2. Combines the data using this formula:
   priority_score = (1 - coverage%) * (total_commits + bug_fix_commits * 2)

   This prioritizes files that are:
   - Low coverage (more to gain from testing)
   - High change frequency (more likely to break)
   - High bug count (historically problematic)

3. Outputs a final prioritized table:

   Priority  File                       Coverage  Changes  Bugs  Score
   ───────────────────────────────────────────────────────────────────
   1         appointment-scheduler.ts    0%        22       8     38.0
   2         notification-service.ts     0%        18       10    38.0
   3         reporting.ts                0%        8        2     12.0
   4         patient-registry.ts         40%       12       3     10.8
   5         billing-service.ts          60%       10       4      7.2
   ...

The script should work by running: node scripts/prioritize-testing.js
```

### Step 6: Discuss the Results

Key discussion questions:
- Does the data-driven priority match your intuition?
- Would you test `appointment-scheduler.ts` or `notification-service.ts` first? Why?
- `notification-service.ts` has higher bug ratio but fewer total commits — which matters more?
- How would you use this data to plan a sprint?

## Expected Results

Three working scripts in `scripts/` that:
- Can be run independently
- Produce clear, formatted output
- Give a data-driven answer to "where should we add tests?"
- Can be re-run as the codebase evolves

## Key Takeaway

> Micro-tools give repeatable, data-driven answers. "Where should I add tests?" becomes a formula, not a guess. These tools persist and can be rerun as the codebase evolves. AI generates the tools; you make the strategic decisions.
