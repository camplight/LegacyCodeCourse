# Analysis Guide 3: Test Coverage Analysis

## Introduction

Test coverage measures how much of your code is executed by automated tests. While high coverage doesn't guarantee quality, **low coverage absolutely guarantees risk** when making changes.

## Why Test Coverage Matters

**Low coverage creates risk:**
- No safety net when refactoring
- Changes may break things silently
- Difficult to understand intended behavior
- Fear of touching code ("works but don't know how")

**Combined with other metrics:**
- Low coverage + high complexity = **extremely risky**
- Low coverage + high change frequency = **constant bug risk**
- Low coverage + upcoming features = **dangerous implementation**

## Understanding Coverage Metrics

Jest (and most coverage tools) report four types of coverage:

### 1. Statement Coverage
Percentage of executable statements executed by tests.

```typescript
function add(a: number, b: number): number {
  return a + b; // One statement
}

// 100% statement coverage with one test
test('adds numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

### 2. Branch Coverage
Percentage of decision branches (if/else, switch, etc.) executed.

```typescript
function absoluteValue(n: number): number {
  if (n < 0) {           // Branch 1: n < 0
    return -n;
  }
  return n;              // Branch 2: n >= 0
}

// 50% branch coverage (only tests positive numbers)
test('handles positive', () => {
  expect(absoluteValue(5)).toBe(5);
});

// 100% branch coverage (tests both branches)
test('handles positive', () => {
  expect(absoluteValue(5)).toBe(5);
});
test('handles negative', () => {
  expect(absoluteValue(-5)).toBe(5);
});
```

### 3. Function Coverage
Percentage of functions called by tests.

### 4. Line Coverage
Percentage of executable lines executed (similar to statement coverage).

## Approach

### Step 1: Run Jest with Coverage

The `legacy-system` is already configured with Jest. Run coverage:

```bash
cd legacy-system
npm install
npm run test:coverage
```

**Output example:**
```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   45.23 |    38.12 |   52.17 |   45.89 |
 email-notifier.ts   |       0 |        0 |       0 |       0 |
 inventory-manager.ts|     100 |      100 |     100 |     100 |
 order-processor.ts  |       0 |        0 |       0 |       0 |
 payment-gateway.ts  |   95.24 |    88.89 |     100 |   95.24 |
 pricing-engine.ts   |   72.34 |    65.52 |   77.78 |   73.91 |
 shipping-calculator.ts| 98.21 |    92.31 |     100 |   98.21 |
---------------------|---------|----------|---------|---------|
```

### Step 2: Parse Coverage Data

Jest generates `coverage/coverage-final.json` with detailed coverage information.

Create `analyze-coverage.js`:

```javascript
const fs = require('fs');
const path = require('path');

function analyzeCoverage() {
  // Read coverage data
  const coveragePath = path.join(__dirname, '../legacy-system/coverage/coverage-final.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ No coverage data found. Run `npm run test:coverage` first.');
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

  const results = [];

  for (const [filePath, data] of Object.entries(coverageData)) {
    // Extract filename from path
    const fileName = path.basename(filePath);

    // Skip test files and non-src files
    if (fileName.includes('.test.') || !filePath.includes('/src/')) {
      continue;
    }

    // Calculate coverage percentages
    const statements = data.s;
    const branches = data.b;
    const functions = data.f;

    const stmtTotal = Object.keys(statements).length;
    const stmtCovered = Object.values(statements).filter(v => v > 0).length;
    const stmtPct = stmtTotal > 0 ? (stmtCovered / stmtTotal * 100) : 0;

    const branchTotal = Object.values(branches).flat().length;
    const branchCovered = Object.values(branches).flat().filter(v => v > 0).length;
    const branchPct = branchTotal > 0 ? (branchCovered / branchTotal * 100) : 0;

    const funcTotal = Object.keys(functions).length;
    const funcCovered = Object.values(functions).filter(v => v > 0).length;
    const funcPct = funcTotal > 0 ? (funcCovered / funcTotal * 100) : 0;

    results.push({
      file: fileName,
      statements: {
        total: stmtTotal,
        covered: stmtCovered,
        pct: stmtPct
      },
      branches: {
        total: branchTotal,
        covered: branchCovered,
        pct: branchPct
      },
      functions: {
        total: funcTotal,
        covered: funcCovered,
        pct: funcPct
      },
      overall: (stmtPct + branchPct + funcPct) / 3
    });
  }

  // Sort by overall coverage (lowest first - highest risk)
  results.sort((a, b) => a.overall - b.overall);

  return results;
}

function reportCoverage(results) {
  console.log('\n=== Test Coverage Analysis ===\n');
  console.log('File'.padEnd(30), 'Stmts', 'Branch', 'Funcs', 'Overall');
  console.log('-'.repeat(70));

  results.forEach(r => {
    const rating =
      r.overall >= 80 ? '✅' :
      r.overall >= 50 ? '⚠️' :
      r.overall > 0 ? '🔶' :
      '🚨';

    console.log(
      `${rating} ${r.file}`.padEnd(30),
      `${r.statements.pct.toFixed(0)}%`.padStart(5),
      `${r.branches.pct.toFixed(0)}%`.padStart(6),
      `${r.functions.pct.toFixed(0)}%`.padStart(5),
      `${r.overall.toFixed(0)}%`.padStart(7)
    );
  });

  // Identify untested files
  const untested = results.filter(r => r.overall === 0);
  if (untested.length > 0) {
    console.log('\n🚨 Completely Untested Files:');
    untested.forEach(r => {
      console.log(`   - ${r.file}`);
    });
  }

  // Identify partially tested files
  const partial = results.filter(r => r.overall > 0 && r.overall < 80);
  if (partial.length > 0) {
    console.log('\n⚠️  Partially Tested Files (< 80% coverage):');
    partial.forEach(r => {
      console.log(`   - ${r.file}: ${r.overall.toFixed(0)}% coverage`);
    });
  }

  // Identify well-tested files
  const wellTested = results.filter(r => r.overall >= 80);
  if (wellTested.length > 0) {
    console.log('\n✅ Well-Tested Files (>= 80% coverage):');
    wellTested.forEach(r => {
      console.log(`   - ${r.file}: ${r.overall.toFixed(0)}% coverage`);
    });
  }

  // Calculate overall coverage
  const totalStmts = results.reduce((sum, r) => sum + r.statements.total, 0);
  const coveredStmts = results.reduce((sum, r) => sum + r.statements.covered, 0);
  const overallPct = (coveredStmts / totalStmts * 100).toFixed(1);

  console.log(`\n📊 Overall System Coverage: ${overallPct}%`);

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    overall: parseFloat(overallPct),
    files: results
  };

  fs.writeFileSync(
    'coverage-analysis.json',
    JSON.stringify(output, null, 2)
  );

  console.log('\n✅ Results saved to coverage-analysis.json');
}

// Run analysis
const results = analyzeCoverage();
reportCoverage(results);
```

**Run the analysis:**
```bash
node analyze-coverage.js
```

### Expected Output

```
=== Test Coverage Analysis ===

File                           Stmts Branch Funcs Overall
----------------------------------------------------------------------
🚨 order-processor.ts             0%     0%    0%      0%
🚨 email-notifier.ts              0%     0%    0%      0%
⚠️  pricing-engine.ts            72%    66%   78%     72%
✅ shipping-calculator.ts        98%    92%  100%     97%
✅ inventory-manager.ts         100%   100%  100%    100%
✅ payment-gateway.ts            95%    89%  100%     95%

🚨 Completely Untested Files:
   - order-processor.ts
   - email-notifier.ts

⚠️  Partially Tested Files (< 80% coverage):
   - pricing-engine.ts: 72% coverage

✅ Well-Tested Files (>= 80% coverage):
   - shipping-calculator.ts: 97% coverage
   - inventory-manager.ts: 100% coverage
   - payment-gateway.ts: 95% coverage

📊 Overall System Coverage: 61.2%
```

## Interpreting Results

### Coverage Thresholds

**🚨 Critical (0% coverage):**
- **Files:** order-processor.ts, email-notifier.ts
- **Risk:** Extremely high - no tests at all
- **Action:** Do NOT modify without adding tests first
- **Recommendation:** Add characterization tests before any changes

**⚠️ Risky (1-79% coverage):**
- **Files:** pricing-engine.ts (72%)
- **Risk:** Moderate - some safety net but gaps remain
- **Action:** Identify uncovered branches before modifying
- **Recommendation:** Add tests for uncovered code paths

**✅ Safe (80-100% coverage):**
- **Files:** shipping-calculator.ts, inventory-manager.ts, payment-gateway.ts
- **Risk:** Low - good test safety net
- **Action:** Can refactor confidently
- **Recommendation:** Maintain coverage with new features

### Red Flags

🚩 **0% coverage on frequently changed files:**
- Example: order-processor.ts (0% coverage, 18 changes)
- **Interpretation:** High-risk area with no safety net
- **Action:** Urgent need for characterization tests

🚩 **Declining coverage trend:**
- New code added without tests
- **Action:** Enforce coverage requirements on new code

🚩 **False sense of security:**
- High statement coverage but low branch coverage
- **Interpretation:** Tests don't exercise all code paths
- **Action:** Add tests for edge cases and error paths

## Exercise: Identify Testing Gaps

### Task

1. Run `npm run test:coverage` in the legacy-system directory
2. Generate the coverage analysis
3. Answer these questions:

**Questions:**
- Which files have 0% coverage?
- Which file has partial coverage (>0% but <80%)?
- What is the overall system coverage percentage?
- How does test coverage correlate with change frequency and complexity?

### Expected Results

<details>
<summary>Click to reveal expected results</summary>

**Files with 0% coverage:**
- order-processor.ts
- email-notifier.ts

**Files with partial coverage:**
- pricing-engine.ts (72%)

**Overall coverage:**
- ~61% (varies slightly based on implementation)

**Risk correlation matrix:**

| File | Changes | Complexity | Coverage | **Risk Level** |
|------|---------|------------|----------|----------------|
| order-processor.ts | 18 | 18 | 0% | 🚨 **CRITICAL** |
| email-notifier.ts | 22 | 8 | 0% | 🚨 **CRITICAL** |
| pricing-engine.ts | 12 | 14 | 72% | ⚠️ **MODERATE** |
| inventory-manager.ts | 4 | 6 | 100% | ✅ **LOW** |
| payment-gateway.ts | 3 | 7 | 95% | ✅ **LOW** |
| shipping-calculator.ts | 2 | 5 | 97% | ✅ **LOW** |

**Key insights:**
- order-processor.ts: High changes + High complexity + No tests = **HIGHEST RISK**
- email-notifier.ts: Highest changes + No tests = **CRITICAL RISK**
- Stable modules (inventory, payment, shipping) all have good coverage

</details>

## Identifying Specific Gaps

To see **which lines** are uncovered, open the HTML coverage report:

```bash
cd legacy-system
npm run test:coverage
open coverage/lcov-report/index.html
```

This visual report shows:
- ✅ Green lines: Covered by tests
- 🔴 Red lines: Not covered
- 🟡 Yellow lines: Partially covered (some branches missed)

## Next Steps

We now have three metrics:
1. ✅ Change frequency (Guide 1)
2. ✅ Complexity (Guide 2)
3. ✅ Test coverage (Guide 3)

Next, we'll combine these into a unified **hotspot detection** model.

Proceed to [Guide 4: Hotspot Detection](./4-hotspot-detection.md) →
