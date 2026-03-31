# Demo 3: Test Coverage Strategy — Micro-tools for Prioritization

## Scenario

The team wants to gradually add tests to ClinicFlow. With limited time, **which files should be tested first?** Instead of guessing, we'll generate micro-tools that answer this question with data.

## Approach: Generate Analysis Micro-tools

We'll create three small scripts that analyze the codebase and produce a prioritized testing plan:

1. **Test gap analyzer** — Which files have low/no coverage?
2. **Change risk analyzer** — Which files change most and have the most bugs?
3. **Priority calculator** — Combine both into a ranked recommendation

## Pre-requisite

This demo requires git history. If not already generated:

```bash
cd legacy-system
rm -rf .git
bash ../scripts/create-git-history.sh
```

## Steps

### Step 1: Generate the Test Gap Analyzer

```
Create a script that analyzes our test coverage and shows which files have the worst coverage. It should run Jest, parse the coverage output, and print a sorted table. Save it as scripts/analyze-test-gaps.js
```

Run it and discuss: Three files have 0% coverage — but are they all equally important to test?

### Step 2: Generate the Change Risk Analyzer

```
Create a script that analyzes our git history and shows which files change the most and have the most bug fixes. Use commit message conventions (fix: vs feat:) to identify bug-fix commits. Calculate a bug ratio for each file. Save it as scripts/analyze-change-risk.js
```

Run it and discuss:
- `notification-service.ts` has the highest bug ratio (55%) — most error-prone
- `appointment-scheduler.ts` has the most commits — changes the most
- Which metric matters more for testing priority?

### Step 3: Generate the Combined Prioritizer

```
Create a script that combines test coverage gaps with change risk to produce a single prioritized list of "test these files first."
Files with low coverage AND high change frequency AND many bugs should rank highest. Save it as scripts/prioritize-testing.js
The priority formula should weight: `(1 - coverage) * (changes + bugFixes * 2)`
```

Run it and discuss:

**Expected top results:**
```
Priority  File                       Coverage  Changes  Bugs  Score
───────────────────────────────────────────────────────────────────
1         appointment-scheduler.ts    0%        22       8     38.0
2         notification-service.ts     0%        18       10    38.0
3         reporting.ts                0%        8        2     12.0
4         patient-registry.ts         ~44%      12       3     ~10
5         billing-service.ts          ~57%      10       4     ~8
```

### Step 4: Discuss the Results

Key discussion questions:
- Does the data-driven priority match your intuition?
- Would you test `appointment-scheduler.ts` or `notification-service.ts` first? Why?
- `notification-service.ts` has higher bug ratio but fewer total commits — which matters more?
- How would you use this data to plan a sprint?

## Expected Results

Three working scripts in `scripts/` that can be run independently and re-run as the codebase evolves.

## Key Takeaway

> Micro-tools give repeatable, data-driven answers. "Where should I add tests?" becomes a formula, not a guess. AI generates the tools; you make the strategic decisions.
