# Analysis Guide 4: Hotspot Detection

## Introduction

**Hotspot detection** combines multiple metrics to identify the highest-risk areas of a codebase. A "hotspot" is code that is:
- Complex (hard to understand)
- Frequently changed (active development or bug fixes)
- Poorly tested (no safety net)

These files are **dangerous to touch** and **expensive to maintain**.

## Why Hotspot Detection Matters

Individual metrics tell part of the story:
- Change frequency → maintenance burden
- Complexity → cognitive load
- Test coverage → safety net

**Combined, they reveal risk:**
- High complexity alone? Stable, well-tested complex code can be fine.
- High changes alone? Simple, well-tested code that changes often is manageable.
- Low coverage alone? Stable code rarely touched can wait for tests.

**But high complexity + high changes + low coverage?** 🚨 **DANGER ZONE**

## The Hotspot Formula

We'll use a weighted formula to calculate risk scores:

```
Risk Score = (Complexity × ChangeFrequency × (1 - TestCoverage)) + (BugFixes × 10)
```

**Why these weights?**

1. **Complexity × ChangeFrequency:** Complex code that changes often is expensive
2. **(1 - TestCoverage):** Lack of tests amplifies risk
3. **BugFixes × 10:** Repeated bug fixes signal structural problems

### Example Calculation

**order-processor.ts:**
- Complexity: 18
- Change Frequency: 18
- Test Coverage: 0% (1 - 0 = 1.0)
- Bug Fixes: 6

```
Risk = (18 × 18 × 1.0) + (6 × 10)
Risk = 324 + 60
Risk = 384
```

**pricing-engine.ts:**
- Complexity: 14
- Change Frequency: 12
- Test Coverage: 72% (1 - 0.72 = 0.28)
- Bug Fixes: 4

```
Risk = (14 × 12 × 0.28) + (4 × 10)
Risk = 47.04 + 40
Risk = 87.04
```

**shipping-calculator.ts:**
- Complexity: 5
- Change Frequency: 2
- Test Coverage: 97% (1 - 0.97 = 0.03)
- Bug Fixes: 0

```
Risk = (5 × 2 × 0.03) + (0 × 10)
Risk = 0.3 + 0
Risk = 0.3
```

## Approach

### Step 1: Gather All Metrics

We need data from previous guides:
- `change-frequency.json` (Guide 1)
- `complexity-analysis.json` (Guide 2)
- `coverage-analysis.json` (Guide 3)

### Step 2: Combine Metrics

Create `detect-hotspots.js`:

```javascript
const fs = require('fs');

function loadMetrics() {
  // Load change frequency data
  const changeData = JSON.parse(
    fs.readFileSync('change-frequency.json', 'utf-8')
  );

  // Load complexity data
  const complexityData = JSON.parse(
    fs.readFileSync('complexity-analysis.json', 'utf-8')
  );

  // Load coverage data
  const coverageData = JSON.parse(
    fs.readFileSync('coverage-analysis.json', 'utf-8')
  );

  return { changeData, complexityData, coverageData };
}

function parseFileName(path) {
  return path.split('/').pop();
}

function countBugFixes(fileName, changeData) {
  // This is simplified - in real implementation, parse git log for "fix:" commits
  // For this example, we'll use hardcoded values based on our git history
  const bugFixes = {
    'order-processor.ts': 6,
    'email-notifier.ts': 14,
    'pricing-engine.ts': 4,
    'inventory-manager.ts': 0,
    'payment-gateway.ts': 0,
    'shipping-calculator.ts': 0
  };

  return bugFixes[fileName] || 0;
}

function calculateHotspots(metrics) {
  const { changeData, complexityData, coverageData } = metrics;

  const files = new Set();

  // Collect all unique files
  Object.keys(changeData.results).forEach(f => files.add(parseFileName(f)));
  complexityData.fileSummary.forEach(f => files.add(f.file));
  coverageData.files.forEach(f => files.add(f.file));

  const hotspots = [];

  files.forEach(file => {
    // Get metrics for this file
    const changes = Object.entries(changeData.results)
      .find(([path]) => parseFileName(path) === file)?.[1] || 0;

    const complexity = complexityData.fileSummary
      .find(f => f.file === file)?.max || 1;

    const coverage = coverageData.files
      .find(f => f.file === file)?.overall || 0;

    const bugs = countBugFixes(file, changeData);

    // Calculate risk score
    const coverageGap = 1 - (coverage / 100);
    const riskScore = (complexity * changes * coverageGap) + (bugs * 10);

    hotspots.push({
      file,
      metrics: {
        complexity,
        changes,
        coverage: coverage.toFixed(1),
        bugs
      },
      riskScore: parseFloat(riskScore.toFixed(2)),
      rating: getRating(riskScore)
    });
  });

  // Sort by risk score descending
  hotspots.sort((a, b) => b.riskScore - a.riskScore);

  return hotspots;
}

function getRating(score) {
  if (score >= 300) return '🚨 CRITICAL';
  if (score >= 100) return '⚠️ HIGH';
  if (score >= 50) return '🔶 MODERATE';
  if (score >= 10) return '⚡ LOW';
  return '✅ MINIMAL';
}

function reportHotspots(hotspots) {
  console.log('\n=== Hotspot Detection Analysis ===\n');
  console.log('File'.padEnd(30), 'Risk', 'Rating'.padEnd(18), 'C', 'Δ', 'Cov', 'B');
  console.log('-'.repeat(80));
  console.log('C=Complexity, Δ=Changes, Cov=Coverage%, B=Bugs');
  console.log('-'.repeat(80));

  hotspots.forEach(h => {
    console.log(
      h.file.padEnd(30),
      h.riskScore.toString().padStart(4),
      h.rating.padEnd(18),
      h.metrics.complexity.toString().padStart(2),
      h.metrics.changes.toString().padStart(2),
      h.metrics.coverage.toString().padStart(3),
      h.metrics.bugs.toString().padStart(2)
    );
  });

  // Summary by risk level
  const critical = hotspots.filter(h => h.riskScore >= 300);
  const high = hotspots.filter(h => h.riskScore >= 100 && h.riskScore < 300);
  const moderate = hotspots.filter(h => h.riskScore >= 50 && h.riskScore < 100);
  const low = hotspots.filter(h => h.riskScore >= 10 && h.riskScore < 50);
  const minimal = hotspots.filter(h => h.riskScore < 10);

  console.log('\n=== Risk Summary ===\n');
  console.log(`🚨 CRITICAL (score >= 300): ${critical.length} files`);
  if (critical.length > 0) {
    critical.forEach(h => console.log(`   - ${h.file} (${h.riskScore})`));
  }

  console.log(`\n⚠️ HIGH (score >= 100): ${high.length} files`);
  if (high.length > 0) {
    high.forEach(h => console.log(`   - ${h.file} (${h.riskScore})`));
  }

  console.log(`\n🔶 MODERATE (score >= 50): ${moderate.length} files`);
  if (moderate.length > 0) {
    moderate.forEach(h => console.log(`   - ${h.file} (${h.riskScore})`));
  }

  console.log(`\n⚡ LOW (score >= 10): ${low.length} files`);
  console.log(`✅ MINIMAL (score < 10): ${minimal.length} files`);

  // Recommendations
  console.log('\n=== Recommendations ===\n');

  if (critical.length > 0) {
    console.log('🚨 CRITICAL PRIORITY:');
    console.log('   These files require immediate attention before any new features.');
    console.log('   Recommended actions:');
    console.log('   1. Add characterization tests');
    console.log('   2. Refactor into smaller, testable modules');
    console.log('   3. Reduce complexity');
    console.log('');
  }

  if (high.length > 0) {
    console.log('⚠️ HIGH PRIORITY:');
    console.log('   Address before major features that touch these files.');
    console.log('   Recommended actions:');
    console.log('   1. Improve test coverage to >80%');
    console.log('   2. Consider refactoring if complexity >15');
    console.log('');
  }

  if (moderate.length > 0) {
    console.log('🔶 MODERATE PRIORITY:');
    console.log('   Monitor and improve incrementally.');
    console.log('   Add tests when making changes.');
    console.log('');
  }

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    hotspots,
    summary: {
      critical: critical.length,
      high: high.length,
      moderate: moderate.length,
      low: low.length,
      minimal: minimal.length
    }
  };

  fs.writeFileSync(
    'hotspot-analysis.json',
    JSON.stringify(output, null, 2)
  );

  console.log('✅ Results saved to hotspot-analysis.json');
}

// Run analysis
try {
  const metrics = loadMetrics();
  const hotspots = calculateHotspots(metrics);
  reportHotspots(hotspots);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nMake sure you have run the previous analysis steps:');
  console.log('  1. Change frequency analysis (creates change-frequency.json)');
  console.log('  2. Complexity analysis (creates complexity-analysis.json)');
  console.log('  3. Coverage analysis (creates coverage-analysis.json)');
  process.exit(1);
}
```

**Run the analysis:**
```bash
node detect-hotspots.js
```

### Expected Output

```
=== Hotspot Detection Analysis ===

File                           Risk Rating             C  Δ Cov  B
--------------------------------------------------------------------------------
C=Complexity, Δ=Changes, Cov=Coverage%, B=Bugs
--------------------------------------------------------------------------------
order-processor.ts              384 🚨 CRITICAL       18 18   0  6
email-notifier.ts               200 🚨 CRITICAL        8 22   0 14
pricing-engine.ts                87 🔶 MODERATE       14 12  72  4
shipping-calculator.ts            0 ✅ MINIMAL         5  2  97  0
inventory-manager.ts              0 ✅ MINIMAL         6  4 100  0
payment-gateway.ts                0 ✅ MINIMAL         7  3  95  0

=== Risk Summary ===

🚨 CRITICAL (score >= 300): 2 files
   - order-processor.ts (384)
   - email-notifier.ts (200)

⚠️ HIGH (score >= 100): 0 files

🔶 MODERATE (score >= 50): 1 files
   - pricing-engine.ts (87)

⚡ LOW (score >= 10): 0 files
✅ MINIMAL (score < 10): 3 files

=== Recommendations ===

🚨 CRITICAL PRIORITY:
   These files require immediate attention before any new features.
   Recommended actions:
   1. Add characterization tests
   2. Refactor into smaller, testable modules
   3. Reduce complexity

🔶 MODERATE PRIORITY:
   Monitor and improve incrementally.
   Add tests when making changes.

✅ Results saved to hotspot-analysis.json
```

## Interpreting Results

### Critical Hotspots (🚨 Risk Score >= 300)

**order-processor.ts (384):**
- **Why critical?** High complexity (18) + High changes (18) + No tests (0%)
- **Impact:** Any change risks breaking orders (core business function)
- **Recommendation:**
  1. Write characterization tests immediately
  2. Refactor into separate modules (validation, pricing, workflow)
  3. Add comprehensive unit tests
  4. Reduce complexity to <10 per function

**email-notifier.ts (200):**
- **Why critical?** Highest bug count (14) + High changes (22) + No tests (0%)
- **Impact:** Email failures hurt customer experience
- **Recommendation:**
  1. Add tests for current behavior
  2. Complete rewrite with template system recommended
  3. Externalize configuration
  4. Add retry logic

### Moderate Hotspots (🔶 Risk Score 50-99)

**pricing-engine.ts (87):**
- **Why moderate?** High complexity (14) + Partial coverage (72%)
- **Impact:** Pricing errors directly affect revenue
- **Recommendation:**
  1. Add tests for uncovered branches
  2. Extract complex shipping logic
  3. Use lookup tables for tax rates

### Low-Risk Files (✅ Risk Score < 10)

**shipping-calculator.ts, inventory-manager.ts, payment-gateway.ts:**
- **Why low risk?** Low complexity + Low changes + Good coverage
- **Impact:** Stable, well-designed modules
- **Recommendation:** Use as examples of good design; maintain test coverage

## Visualizing Hotspots

A scatter plot helps visualize the relationship:

```
Risk Score
  400 │                    ● order-processor.ts
      │
  300 │
      │                 ● email-notifier.ts
  200 │
      │
  100 │          ● pricing-engine.ts
      │
   50 │
      │                           ● shipping-calculator.ts
    0 │                        ● inventory-manager.ts
      │                           ● payment-gateway.ts
      └─────────────────────────────────────────────
        0      5      10     15     20     25
                    Changes (Δ)
```

**Quadrants:**
- **Top-right:** High changes + High risk = 🚨 **CRITICAL**
- **Top-left:** Low changes + High risk = ⚠️ **Refactor when touched**
- **Bottom-right:** High changes + Low risk = ✅ **Well-maintained**
- **Bottom-left:** Low changes + Low risk = ✅ **Stable**

## Exercise: Analyze and Prioritize

### Task

1. Run the complete analysis pipeline:
   ```bash
   # 1. Change frequency
   node analyze-changes.js

   # 2. Complexity
   node analyze-complexity.js

   # 3. Coverage
   cd legacy-system && npm run test:coverage && cd ..
   node analyze-coverage.js

   # 4. Hotspots
   node detect-hotspots.js
   ```

2. Answer these questions:

**Questions:**
- Which files are in the critical risk category?
- What are the top 3 files by risk score?
- How do the "stable" files differ from "hotspots"?
- If you could only refactor one file, which would it be and why?

### Expected Results

<details>
<summary>Click to reveal expected results</summary>

**Critical risk files:**
1. order-processor.ts (risk: 384)
2. email-notifier.ts (risk: 200)

**Top 3 by risk score:**
1. order-processor.ts (384)
2. email-notifier.ts (200)
3. pricing-engine.ts (87)

**Stable vs. Hotspots:**
- **Stable files** (inventory, payment, shipping):
  - Low complexity (<7)
  - Few changes (<5)
  - High coverage (>95%)
  - No bugs
  - Result: Risk score <1

- **Hotspots** (order-processor, email-notifier):
  - High complexity or high bug count
  - Many changes (>15)
  - No coverage (0%)
  - Multiple bugs
  - Result: Risk score >200

**If only one refactoring:**
- **order-processor.ts** - Highest risk score (384)
- Reasons:
  - Core business logic (orders)
  - No tests (0% coverage)
  - High complexity (18)
  - Many changes (18)
  - Needed for Q2 subscription feature (see business roadmap)
  - ROI: Enables $500K ARR subscription feature safely

</details>

## Next Steps

We now have complete risk analysis:
1. ✅ Change frequency
2. ✅ Complexity
3. ✅ Test coverage
4. ✅ Hotspot detection

Final step: Align this technical analysis with the **business roadmap** to create a value-driven modernization strategy.

Proceed to [Guide 5: Modernization Roadmap](./5-modernization-roadmap.md) →
