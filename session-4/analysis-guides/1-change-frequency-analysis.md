# Analysis Guide 1: Change Frequency Analysis

## Introduction

Change frequency analysis helps identify **maintenance hotspots** in a codebase. Files that change frequently often indicate:

- Areas of high business value (features added often)
- Problem areas (bugs fixed repeatedly)
- Poor initial design (requires constant modification)

By analyzing git history, we can quantify which files are "touched" most often, revealing where our maintenance burden lies.

## Why Change Frequency Matters

**High change frequency signals risk:**
- More chances to introduce bugs
- Higher cognitive load for developers (constantly revisiting code)
- Merge conflicts and coordination overhead
- Code that's "never stable"

**Combined with other metrics:**
- High change frequency + low test coverage = **very high risk**
- High change frequency + high complexity = **maintenance nightmare**
- High change frequency + bug fixes = **structural problems**

## Approach

### Method 1: Using Git Log (Simple)

The simplest approach uses git's built-in log command:

```bash
# Count changes per file
git log --name-only --pretty=format:"" | \
  grep -v '^$' | \
  sort | \
  uniq -c | \
  sort -rn
```

**Output example:**
```
  22 src/email-notifier.ts
  18 src/order-processor.ts
  12 src/pricing-engine.ts
   4 src/inventory-manager.ts
   3 src/payment-gateway.ts
   2 src/shipping-calculator.ts
```

**Interpretation:**
- `email-notifier.ts` changed 22 times (highest)
- `order-processor.ts` changed 18 times
- Stable modules (inventory, payment, shipping) changed ≤4 times

### Method 2: Using simple-git (Programmatic)

For more control and richer analysis, use the `simple-git` npm package:

```bash
npm install simple-git
```

Create `analyze-changes.js`:

```javascript
const simpleGit = require('simple-git');
const git = simpleGit();

async function analyzeChangeFrequency() {
  // Get all commit logs
  const logs = await git.log();

  // Count changes per file
  const fileChanges = {};

  for (const commit of logs.all) {
    // Get files changed in this commit
    const diff = await git.show([
      '--name-only',
      '--pretty=format:',
      commit.hash
    ]);

    const files = diff.split('\n').filter(f => f.trim());

    for (const file of files) {
      if (file.startsWith('src/') && file.endsWith('.ts')) {
        fileChanges[file] = (fileChanges[file] || 0) + 1;
      }
    }
  }

  // Sort by frequency
  const sorted = Object.entries(fileChanges)
    .sort((a, b) => b[1] - a[1]);

  // Output results
  console.log('\n=== Change Frequency Analysis ===\n');
  sorted.forEach(([file, count]) => {
    console.log(`${count.toString().padStart(3)}  ${file}`);
  });

  // Save to JSON
  const fs = require('fs');
  fs.writeFileSync(
    'change-frequency.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      results: Object.fromEntries(sorted)
    }, null, 2)
  );

  console.log('\n✅ Results saved to change-frequency.json');
}

analyzeChangeFrequency().catch(console.error);
```

**Run the analysis:**
```bash
node analyze-changes.js
```

**Output (change-frequency.json):**
```json
{
  "timestamp": "2024-02-12T10:30:00.000Z",
  "results": {
    "src/email-notifier.ts": 22,
    "src/order-processor.ts": 18,
    "src/pricing-engine.ts": 12,
    "src/inventory-manager.ts": 4,
    "src/payment-gateway.ts": 3,
    "src/shipping-calculator.ts": 2
  }
}
```

### Method 3: Distinguishing Features from Bug Fixes

To separate feature additions from bug fixes, analyze commit messages:

```javascript
const simpleGit = require('simple-git');
const git = simpleGit();

async function analyzeChangesWithType() {
  const logs = await git.log();

  const fileStats = {};

  for (const commit of logs.all) {
    const message = commit.message.toLowerCase();
    const isBugFix = message.startsWith('fix:') ||
                      message.includes('bug') ||
                      message.includes('fix');

    const diff = await git.show([
      '--name-only',
      '--pretty=format:',
      commit.hash
    ]);

    const files = diff.split('\n').filter(f =>
      f.startsWith('src/') && f.endsWith('.ts')
    );

    for (const file of files) {
      if (!fileStats[file]) {
        fileStats[file] = { features: 0, bugs: 0, total: 0 };
      }

      fileStats[file].total++;
      if (isBugFix) {
        fileStats[file].bugs++;
      } else {
        fileStats[file].features++;
      }
    }
  }

  // Calculate bug ratio
  const results = Object.entries(fileStats).map(([file, stats]) => ({
    file,
    total: stats.total,
    features: stats.features,
    bugs: stats.bugs,
    bugRatio: (stats.bugs / stats.total * 100).toFixed(1) + '%'
  })).sort((a, b) => b.total - a.total);

  console.log('\n=== Change Analysis with Bug Tracking ===\n');
  console.log('File'.padEnd(40), 'Total', 'Features', 'Bugs', 'Bug%');
  console.log('-'.repeat(70));

  results.forEach(r => {
    console.log(
      r.file.padEnd(40),
      r.total.toString().padStart(5),
      r.features.toString().padStart(8),
      r.bugs.toString().padStart(4),
      r.bugRatio.padStart(6)
    );
  });

  return results;
}

analyzeChangesWithType().catch(console.error);
```

**Expected output:**
```
=== Change Analysis with Bug Tracking ===

File                                     Total Features Bugs  Bug%
----------------------------------------------------------------------
src/email-notifier.ts                       22        8    14  63.6%
src/order-processor.ts                      18       12     6  33.3%
src/pricing-engine.ts                       12        8     4  33.3%
src/inventory-manager.ts                     4        4     0   0.0%
src/payment-gateway.ts                       3        3     0   0.0%
src/shipping-calculator.ts                   2        2     0   0.0%
```

**Key insight:** `email-notifier.ts` has 63.6% bug ratio - most changes are fixes, not features!

## Interpreting Results

### Thresholds and Classification

Based on the analysis:

- **High change frequency:** >15 commits
  - Files: order-processor.ts (18), email-notifier.ts (22)
  - **Interpretation:** Active development or problematic areas

- **Medium change frequency:** 5-15 commits
  - Files: pricing-engine.ts (12)
  - **Interpretation:** Moderate activity, monitor trends

- **Low change frequency:** <5 commits
  - Files: inventory-manager.ts (4), payment-gateway.ts (3), shipping-calculator.ts (2)
  - **Interpretation:** Stable modules, well-designed

### Red Flags

🚩 **High bug ratio (>40%):**
- Example: email-notifier.ts (63.6% bugs)
- **Action:** Investigate root cause - likely structural problems

🚩 **Frequent small fixes:**
- Pattern of "fix → fix → fix" in git history
- **Action:** Consider rewrite rather than incremental fixes

🚩 **Recently accelerating changes:**
- File stable for months, then 5+ commits in a week
- **Action:** Sign of technical debt accumulating

## Exercise: Analyze the Legacy System

### Task

1. Navigate to the `legacy-system/` directory
2. Run change frequency analysis using one of the methods above
3. Answer these questions:

**Questions:**
- Which file has changed most frequently?
- Which file has the highest bug-fix ratio?
- Which files are stable (changed ≤3 times)?
- Based on change frequency alone, which files would you prioritize for refactoring?

### Expected Results

<details>
<summary>Click to reveal expected results</summary>

**Change frequency ranking:**
1. email-notifier.ts: 22 changes
2. order-processor.ts: 18 changes
3. pricing-engine.ts: 12 changes
4. inventory-manager.ts: 4 changes
5. payment-gateway.ts: 3 changes
6. shipping-calculator.ts: 2 changes

**Bug-fix analysis:**
- email-notifier.ts: 14 bug fixes (63.6% ratio) ⚠️ RED FLAG
- order-processor.ts: 6 bug fixes (33.3% ratio)
- pricing-engine.ts: 4 bug fixes (33.3% ratio)
- inventory-manager.ts: 0 bug fixes ✅ STABLE
- payment-gateway.ts: 0 bug fixes ✅ STABLE
- shipping-calculator.ts: 0 bug fixes ✅ STABLE

**Initial prioritization (based on change frequency alone):**
1. email-notifier.ts (highest changes + highest bug ratio)
2. order-processor.ts (second highest changes)
3. pricing-engine.ts (moderate changes)

</details>

## Next Steps

Change frequency is just one metric. To get a complete picture, we need to combine it with:

- **Complexity metrics** (Guide 2) - how hard is the code to understand?
- **Test coverage** (Guide 3) - is there a safety net?
- **Hotspot detection** (Guide 4) - which files are highest risk overall?
- **Business alignment** (Guide 5) - which files matter for upcoming features?

Proceed to [Guide 2: Complexity Metrics](./2-complexity-metrics.md) →
