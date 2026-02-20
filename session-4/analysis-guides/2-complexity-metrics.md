# Analysis Guide 2: Complexity Metrics

## Introduction

Code complexity measures how difficult code is to understand and modify. The most common metric is **cyclomatic complexity**, which counts the number of independent paths through code.

## Why Complexity Matters

**High complexity creates risk:**
- Harder to understand (cognitive load)
- More places for bugs to hide
- Difficult to test thoroughly
- Risky to change (unintended consequences)

**Combined with other metrics:**
- High complexity + high change frequency = **high maintenance cost**
- High complexity + low test coverage = **very risky**
- High complexity + bug fixes = **needs refactoring**

## Understanding Cyclomatic Complexity

### The Formula

Cyclomatic complexity = Number of decision points + 1

**Decision points include:**
- `if` / `else if` / `else`
- `switch` / `case`
- `for` / `while` / `do-while`
- `&&` / `||` (logical operators)
- `? :` (ternary operators)
- `catch` blocks

### Complexity Thresholds

| Complexity | Rating | Interpretation |
|------------|--------|----------------|
| 1-10 | Simple | Easy to understand and test |
| 11-20 | Complex | Moderate risk, consider refactoring |
| 21-50 | Very Complex | High risk, refactoring recommended |
| 50+ | Extremely Complex | Very high risk, rewrite recommended |

### Example

```typescript
// Complexity = 1 (no decisions)
function addNumbers(a: number, b: number): number {
  return a + b;
}

// Complexity = 2 (one if)
function absoluteValue(n: number): number {
  if (n < 0) {
    return -n;
  }
  return n;
}

// Complexity = 4 (three if statements)
function getDiscount(tier: string): number {
  if (tier === 'vip') {
    return 0.15;
  } else if (tier === 'premium') {
    return 0.1;
  } else {
    return 0;
  }
}

// Complexity = 7 (nested conditions)
function calculateShipping(subtotal: number, country: string): number {
  if (country === 'US') {
    if (subtotal >= 50) {
      return 5.99;
    } else {
      return 9.99;
    }
  } else if (country === 'UK') {
    if (subtotal >= 50) {
      return 4.99;
    } else {
      return 8.99;
    }
  } else {
    return 19.99;
  }
}
```

## Approach

### Method 1: Using TypeScript ESLint

Install dependencies:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint
```

Create `analyze-complexity.js`:

```javascript
const fs = require('fs');
const path = require('path');
const parser = require('@typescript-eslint/parser');

function calculateComplexity(node) {
  let complexity = 1; // Base complexity

  function visit(n) {
    if (!n) return;

    // Count decision points
    if (n.type === 'IfStatement') complexity++;
    if (n.type === 'ConditionalExpression') complexity++; // ternary
    if (n.type === 'ForStatement') complexity++;
    if (n.type === 'ForInStatement') complexity++;
    if (n.type === 'ForOfStatement') complexity++;
    if (n.type === 'WhileStatement') complexity++;
    if (n.type === 'DoWhileStatement') complexity++;
    if (n.type === 'SwitchCase' && n.test !== null) complexity++;
    if (n.type === 'CatchClause') complexity++;
    if (n.type === 'LogicalExpression' && n.operator === '&&') complexity++;
    if (n.type === 'LogicalExpression' && n.operator === '||') complexity++;

    // Recursively visit children
    for (const key in n) {
      if (key === 'parent' || key === 'tokens' || key === 'comments') {
        continue;
      }
      const child = n[key];
      if (Array.isArray(child)) {
        child.forEach(visit);
      } else if (child && typeof child === 'object' && child.type) {
        visit(child);
      }
    }
  }

  visit(node);
  return complexity;
}

function analyzeFunctionComplexity(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');

  const ast = parser.parse(code, {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: false
    }
  });

  const functions = [];

  function findFunctions(node, fileName) {
    if (!node) return;

    // Function declarations
    if (node.type === 'FunctionDeclaration' && node.id) {
      const complexity = calculateComplexity(node.body);
      functions.push({
        name: node.id.name,
        file: fileName,
        complexity,
        line: node.loc.start.line
      });
    }

    // Exported functions
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
        const complexity = calculateComplexity(node.declaration.body);
        functions.push({
          name: node.declaration.id.name,
          file: fileName,
          complexity,
          line: node.declaration.loc.start.line,
          exported: true
        });
      }
    }

    // Arrow functions assigned to exports
    if (node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration') {
      node.declaration.declarations.forEach(decl => {
        if (decl.init?.type === 'ArrowFunctionExpression') {
          const complexity = calculateComplexity(decl.init.body);
          functions.push({
            name: decl.id.name,
            file: fileName,
            complexity,
            line: decl.loc.start.line,
            exported: true
          });
        }
      });
    }

    // Recursively find functions
    for (const key in node) {
      if (key === 'parent') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => findFunctions(c, fileName));
      } else if (child && typeof child === 'object') {
        findFunctions(child, fileName);
      }
    }
  }

  const fileName = path.basename(filePath);
  findFunctions(ast, fileName);

  return functions;
}

function analyzeDirectory(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  const allFunctions = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    console.log(`Analyzing ${file}...`);

    try {
      const functions = analyzeFunctionComplexity(filePath);
      allFunctions.push(...functions);
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error.message);
    }
  });

  return allFunctions;
}

function reportComplexity(functions) {
  // Sort by complexity descending
  const sorted = functions.sort((a, b) => b.complexity - a.complexity);

  console.log('\n=== Complexity Analysis ===\n');
  console.log('Complexity'.padEnd(12), 'Function'.padEnd(30), 'File');
  console.log('-'.repeat(70));

  sorted.forEach(fn => {
    const rating =
      fn.complexity <= 10 ? '✅' :
      fn.complexity <= 20 ? '⚠️' :
      '🚨';

    console.log(
      `${rating} ${fn.complexity.toString().padStart(2)}`.padEnd(12),
      fn.name.padEnd(30),
      `${fn.file}:${fn.line}`
    );
  });

  // Calculate file-level averages
  const fileComplexity = {};
  functions.forEach(fn => {
    if (!fileComplexity[fn.file]) {
      fileComplexity[fn.file] = { total: 0, count: 0, max: 0 };
    }
    fileComplexity[fn.file].total += fn.complexity;
    fileComplexity[fn.file].count++;
    fileComplexity[fn.file].max = Math.max(fileComplexity[fn.file].max, fn.complexity);
  });

  console.log('\n=== File-Level Complexity ===\n');
  console.log('File'.padEnd(35), 'Avg', 'Max', 'Functions');
  console.log('-'.repeat(60));

  Object.entries(fileComplexity)
    .sort((a, b) => b[1].max - a[1].max)
    .forEach(([file, stats]) => {
      const avg = (stats.total / stats.count).toFixed(1);
      const rating = stats.max > 15 ? '🚨' : stats.max > 10 ? '⚠️' : '✅';

      console.log(
        `${rating} ${file}`.padEnd(35),
        avg.toString().padStart(4),
        stats.max.toString().padStart(3),
        stats.count.toString().padStart(9)
      );
    });

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    functions: sorted,
    fileSummary: Object.entries(fileComplexity).map(([file, stats]) => ({
      file,
      average: parseFloat((stats.total / stats.count).toFixed(1)),
      max: stats.max,
      functionCount: stats.count
    })).sort((a, b) => b.max - a.max)
  };

  fs.writeFileSync(
    'complexity-analysis.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Results saved to complexity-analysis.json');
}

// Run analysis
const srcDir = path.join(__dirname, '../legacy-system/src');
const functions = analyzeDirectory(srcDir);
reportComplexity(functions);
```

**Run the analysis:**
```bash
node analyze-complexity.js
```

### Expected Output

```
=== Complexity Analysis ===

Complexity   Function                       File
----------------------------------------------------------------------
🚨 18        finalizeOrder                  order-processor.ts:92
🚨 16        applyDiscounts                 order-processor.ts:58
⚠️ 14        calculateShipping              pricing-engine.ts:42
⚠️ 12        validateOrder                  order-processor.ts:28
⚠️ 11        calculateTaxAmount             pricing-engine.ts:88
✅  8        sendOrderConfirmation          email-notifier.ts:15
✅  7        processPayment                 payment-gateway.ts:10
✅  6        checkStock                     inventory-manager.ts:25
...

=== File-Level Complexity ===

File                                Avg  Max Functions
------------------------------------------------------------
🚨 order-processor.ts               12.3  18         6
⚠️ pricing-engine.ts                 9.8  14         8
⚠️ email-notifier.ts                 6.2   8         4
✅ inventory-manager.ts              4.1   6         8
✅ payment-gateway.ts                3.8   7         5
✅ shipping-calculator.ts            3.2   5         4
```

## Interpreting Results

### High-Complexity Functions

**🚨 `finalizeOrder` (complexity: 18)**
- **Location:** order-processor.ts:92
- **Issue:** Too many responsibilities (validation, pricing, payment, email)
- **Recommendation:** Split into smaller functions with single responsibilities

**🚨 `applyDiscounts` (complexity: 16)**
- **Location:** order-processor.ts:58
- **Issue:** Nested loops with complex conditional logic
- **Recommendation:** Extract discount rules into data-driven configuration

**⚠️ `calculateShipping` (complexity: 14)**
- **Location:** pricing-engine.ts:42
- **Issue:** Deep nesting for regional rates
- **Recommendation:** Use lookup table or strategy pattern

### File-Level Insights

**🚨 order-processor.ts (avg: 12.3, max: 18)**
- Multiple high-complexity functions
- God class anti-pattern (does too much)
- **Action:** Refactor into smaller, focused modules

**⚠️ pricing-engine.ts (avg: 9.8, max: 14)**
- Moderate average, one high-complexity function
- **Action:** Refactor `calculateShipping`, add tests

**✅ Stable files (avg <5)**
- inventory-manager.ts, payment-gateway.ts, shipping-calculator.ts
- Well-designed, simple functions
- **Action:** None - use as examples of good design

## Exercise: Analyze and Prioritize

### Task

1. Run the complexity analysis on the legacy system
2. Identify the top 3 most complex functions
3. For each function, propose a refactoring strategy

**Questions:**
- Which file has the highest maximum complexity?
- Which file has the highest average complexity?
- How does complexity correlate with change frequency (from Guide 1)?

### Expected Results

<details>
<summary>Click to reveal expected results</summary>

**Most complex functions:**
1. `finalizeOrder` (18) - order-processor.ts
2. `applyDiscounts` (16) - order-processor.ts
3. `calculateShipping` (14) - pricing-engine.ts

**Highest max complexity:**
- order-processor.ts (18)

**Highest average complexity:**
- order-processor.ts (12.3)

**Correlation with change frequency:**
- order-processor.ts: High complexity (18) + High changes (18) = 🚨 **CRITICAL RISK**
- email-notifier.ts: Medium complexity (8) + Highest changes (22) = ⚠️ **HIGH RISK**
- pricing-engine.ts: High complexity (14) + Medium changes (12) = ⚠️ **MODERATE RISK**

</details>

## Next Steps

We now have two metrics:
1. ✅ Change frequency (Guide 1)
2. ✅ Complexity (Guide 2)

Next, we'll add test coverage analysis to complete the risk picture.

Proceed to [Guide 3: Test Coverage Analysis](./3-test-coverage-analysis.md) →
