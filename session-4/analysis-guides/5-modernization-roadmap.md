# Analysis Guide 5: Modernization Roadmap

## Introduction

We now have comprehensive **technical analysis** (hotspots, complexity, coverage). But **technical risk alone doesn't determine priorities** - we must align modernization work with **business value**.

**This guide teaches you to:**
1. Map technical hotspots to upcoming features
2. Calculate value/effort ratios
3. Select appropriate refactoring strategies
4. Create phased modernization roadmaps

## Why Business Alignment Matters

**Technical debt is only relevant in business context:**

❌ **Wrong approach:** "Let's refactor everything to 100% coverage"
- Wastes time on stable code that never changes
- Delays features that generate revenue
- No clear ROI

✅ **Right approach:** "Let's fix files blocking high-value features"
- Focuses effort where it matters
- Enables business objectives
- Clear ROI (revenue enabled vs. time invested)

## The Value-Driven Framework

### 1. Technical Risk (from Guide 4)

We have hotspot scores:
- order-processor.ts: 384 (🚨 CRITICAL)
- email-notifier.ts: 200 (🚨 CRITICAL)
- pricing-engine.ts: 87 (🔶 MODERATE)

### 2. Business Impact (from roadmap)

From `business-roadmap.md`, map features to files:

**Q1 2024 Features:**
- Multi-currency: pricing-engine.ts, order-processor.ts, payment-gateway.ts
- Advanced discounts: pricing-engine.ts, order-processor.ts

**Q2 2024 Features:**
- Subscriptions: order-processor.ts, inventory-manager.ts, payment-gateway.ts, email-notifier.ts
- Fraud detection: payment-gateway.ts, order-processor.ts

**Q3 2024 Features:**
- International shipping: shipping-calculator.ts, pricing-engine.ts
- Email templates: email-notifier.ts

### 3. Calculate Value Score

```
Value = (RiskReduction + FeatureEnablement) / Effort

Where:
- RiskReduction = Current hotspot score / 100
- FeatureEnablement = Business value of enabled features
  - Critical feature = 10 points
  - High priority = 7 points
  - Medium priority = 4 points
- Effort = Estimated weeks to modernize
```

### Example Calculation: order-processor.ts

**RiskReduction:**
- Current risk score: 384
- Risk reduction: 384 / 100 = 3.84 points

**FeatureEnablement:**
- Multi-currency (Q1, High priority): 7 points
- Advanced discounts (Q1, Medium): 4 points
- Subscriptions (Q2, Critical): 10 points
- Fraud detection (Q2, High): 7 points
- **Total:** 28 points

**Effort:**
- Estimated: 3 weeks (add tests + refactor)

**Value Score:**
```
Value = (3.84 + 28) / 3
Value = 31.84 / 3
Value = 10.61
```

## Approach

### Step 1: Map Features to Files

Create `map-features.js`:

```javascript
const fs = require('fs');

function loadHotspots() {
  return JSON.parse(fs.readFileSync('hotspot-analysis.json', 'utf-8'));
}

function defineFeatures() {
  return [
    {
      name: 'Multi-Currency Support',
      quarter: 'Q1',
      priority: 'high',
      businessValue: 7,
      files: ['pricing-engine.ts', 'order-processor.ts', 'payment-gateway.ts']
    },
    {
      name: 'Advanced Discount Rules',
      quarter: 'Q1',
      priority: 'medium',
      businessValue: 4,
      files: ['pricing-engine.ts', 'order-processor.ts']
    },
    {
      name: 'Subscription Orders',
      quarter: 'Q2',
      priority: 'critical',
      businessValue: 10,
      files: ['order-processor.ts', 'inventory-manager.ts', 'payment-gateway.ts', 'email-notifier.ts']
    },
    {
      name: 'Fraud Detection',
      quarter: 'Q2',
      priority: 'high',
      businessValue: 7,
      files: ['payment-gateway.ts', 'order-processor.ts']
    },
    {
      name: 'International Shipping',
      quarter: 'Q3',
      priority: 'medium',
      businessValue: 4,
      files: ['shipping-calculator.ts', 'pricing-engine.ts']
    },
    {
      name: 'Email Template System',
      quarter: 'Q3',
      priority: 'medium',
      businessValue: 4,
      files: ['email-notifier.ts']
    }
  ];
}

function calculateFileValue(hotspots) {
  const features = defineFeatures();
  const fileData = {};

  // Initialize file data
  hotspots.hotspots.forEach(h => {
    fileData[h.file] = {
      file: h.file,
      riskScore: h.riskScore,
      riskReduction: h.riskScore / 100,
      featuresImpacted: [],
      totalBusinessValue: 0,
      quarters: new Set()
    };
  });

  // Map features to files
  features.forEach(feature => {
    feature.files.forEach(file => {
      if (fileData[file]) {
        fileData[file].featuresImpacted.push({
          name: feature.name,
          quarter: feature.quarter,
          priority: feature.priority,
          value: feature.businessValue
        });
        fileData[file].totalBusinessValue += feature.businessValue;
        fileData[file].quarters.add(feature.quarter);
      }
    });
  });

  return Object.values(fileData);
}

function estimateEffort(file, riskScore) {
  // Effort estimation based on risk score and file characteristics
  if (riskScore >= 300) {
    return 3; // weeks - major refactoring
  } else if (riskScore >= 100) {
    return 2; // weeks - significant work
  } else if (riskScore >= 50) {
    return 1; // weeks - moderate work
  } else {
    return 0.5; // weeks - minor improvements
  }
}

function calculateValueScores(fileData) {
  return fileData.map(f => {
    const effort = estimateEffort(f.file, f.riskScore);
    const totalValue = f.riskReduction + f.totalBusinessValue;
    const valueScore = effort > 0 ? totalValue / effort : 0;

    return {
      ...f,
      effort,
      totalValue,
      valueScore: parseFloat(valueScore.toFixed(2))
    };
  }).sort((a, b) => b.valueScore - a.valueScore);
}

function reportValueAnalysis(valueData) {
  console.log('\n=== Value-Driven Modernization Analysis ===\n');
  console.log('File'.padEnd(30), 'Value', 'Risk', 'BizV', 'Effort', 'Features');
  console.log('-'.repeat(85));

  valueData.forEach(f => {
    const rating =
      f.valueScore >= 10 ? '🎯' :
      f.valueScore >= 5 ? '⭐' :
      f.valueScore >= 2 ? '✔️' :
      '⏸️';

    const quarters = Array.from(f.quarters).sort().join(',');

    console.log(
      `${rating} ${f.file}`.padEnd(30),
      f.valueScore.toString().padStart(5),
      f.riskScore.toString().padStart(4),
      f.totalBusinessValue.toString().padStart(4),
      `${f.effort}w`.padStart(6),
      f.featuresImpacted.length.toString().padStart(8)
    );
  });

  console.log('\n=== Priority Classification ===\n');

  const highValue = valueData.filter(f => f.valueScore >= 10);
  const mediumValue = valueData.filter(f => f.valueScore >= 5 && f.valueScore < 10);
  const lowValue = valueData.filter(f => f.valueScore >= 2 && f.valueScore < 5);
  const deferValue = valueData.filter(f => f.valueScore < 2);

  if (highValue.length > 0) {
    console.log('🎯 HIGH VALUE (score >= 10): Must address before Q2');
    highValue.forEach(f => {
      console.log(`   ${f.file} (value: ${f.valueScore})`);
      console.log(`      - Blocks ${f.featuresImpacted.length} features`);
      console.log(`      - Risk score: ${f.riskScore}`);
      console.log(`      - Estimated effort: ${f.effort} weeks`);
    });
    console.log('');
  }

  if (mediumValue.length > 0) {
    console.log('⭐ MEDIUM VALUE (score 5-9): Address when touched');
    mediumValue.forEach(f => {
      console.log(`   ${f.file} (value: ${f.valueScore})`);
    });
    console.log('');
  }

  if (lowValue.length > 0) {
    console.log('✔️ LOW VALUE (score 2-4): Improve incrementally');
    lowValue.forEach(f => {
      console.log(`   ${f.file} (value: ${f.valueScore})`);
    });
    console.log('');
  }

  if (deferValue.length > 0) {
    console.log('⏸️ DEFER (score < 2): Not urgent');
    deferValue.forEach(f => {
      console.log(`   ${f.file} (value: ${f.valueScore})`);
    });
    console.log('');
  }

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    files: valueData
  };

  fs.writeFileSync(
    'value-analysis.json',
    JSON.stringify(output, null, 2)
  );

  console.log('✅ Results saved to value-analysis.json');
}

// Run analysis
const hotspots = loadHotspots();
const fileData = calculateFileValue(hotspots);
const valueData = calculateValueScores(fileData);
reportValueAnalysis(valueData);
```

**Run the analysis:**
```bash
node map-features.js
```

### Expected Output

```
=== Value-Driven Modernization Analysis ===

File                           Value Risk BizV Effort Features
-------------------------------------------------------------------------------------
🎯 order-processor.ts          10.61  384   28     3w        4
🎯 email-notifier.ts            7.33  200   11     3w        2
⭐ pricing-engine.ts            5.96   87   15   1.5w        3
✔️ payment-gateway.ts           4.80    0   24   0.5w        3
⏸️ inventory-manager.ts         1.00    0   10   0.5w        1
⏸️ shipping-calculator.ts       0.80    0    4   0.5w        1

=== Priority Classification ===

🎯 HIGH VALUE (score >= 10): Must address before Q2
   order-processor.ts (value: 10.61)
      - Blocks 4 features
      - Risk score: 384
      - Estimated effort: 3 weeks

   email-notifier.ts (value: 7.33)
      - Blocks 2 features
      - Risk score: 200
      - Estimated effort: 3 weeks

⭐ MEDIUM VALUE (score 5-9): Address when touched
   pricing-engine.ts (value: 5.96)

✔️ LOW VALUE (score 2-4): Improve incrementally
   payment-gateway.ts (value: 4.80)

⏸️ DEFER (score < 2): Not urgent
   inventory-manager.ts (value: 1.00)
   shipping-calculator.ts (value: 0.80)

✅ Results saved to value-analysis.json
```

## Creating the Modernization Roadmap

### Step 2: Select Refactoring Strategies

For each high-value file, choose the appropriate strategy:

| File | Risk | Strategy | Rationale |
|------|------|----------|-----------|
| order-processor.ts | 384 | **Extract & Test** | Core logic needed for features; refactor into modules |
| email-notifier.ts | 200 | **Rewrite** | 63% bug ratio indicates structural failure; fresh start cheaper |
| pricing-engine.ts | 87 | **Characterization Tests + Incremental** | 72% coverage already; fill gaps and refactor complex parts |

### Step 3: Create Phased Plan

**Phase 1: Pre-Q1 (January)**
- **Goal:** Enable Q1 features (multi-currency, advanced discounts)
- **Work:**
  - pricing-engine.ts: Add tests for uncovered branches
  - pricing-engine.ts: Extract tax and shipping lookup tables
  - **Effort:** 1.5 weeks
  - **Outcome:** Safe foundation for Q1 features

**Phase 2: Q1 (February-March)**
- **Goal:** Implement Q1 features safely
- **Work:**
  - Multi-currency implementation
  - Advanced discount rules
  - **Effort:** 4 weeks (features only, no major refactoring)
  - **Outcome:** Q1 features delivered

**Phase 3: Post-Q1 / Pre-Q2 (April)**
- **Goal:** Prepare for Q2 subscriptions feature
- **Work:**
  - order-processor.ts: Add comprehensive characterization tests
  - order-processor.ts: Refactor into modules:
    - order-validation.ts
    - order-pricing.ts
    - order-workflow.ts
  - Remove global state, add dependency injection
  - **Effort:** 3 weeks
  - **Outcome:** order-processor.ts ready for subscription feature

**Phase 4: Q2 (May-June)**
- **Goal:** Implement Q2 features
- **Work:**
  - Subscription orders implementation
  - Fraud detection implementation
  - **Effort:** 8 weeks
  - **Outcome:** Q2 features delivered, subscription revenue enabled

**Phase 5: Post-Q2 / Pre-Q3 (July)**
- **Goal:** Prepare for Q3 email templates
- **Work:**
  - email-notifier.ts: Add characterization tests for current behavior
  - email-notifier.ts: Rewrite with template system
  - Migrate existing emails to templates
  - **Effort:** 3 weeks
  - **Outcome:** Modern email system

**Phase 6: Q3 (August-September)**
- **Goal:** Implement Q3 features
- **Work:**
  - International shipping
  - Email template features
  - **Effort:** 4 weeks
  - **Outcome:** Q3 features delivered

### Total Investment: ~6 weeks modernization + ~16 weeks features = 22 weeks

**ROI:**
- Subscriptions: $500K ARR (blocked without order-processor refactoring)
- Reduced bug rate: ~50% fewer bugs (historical pattern)
- Feature velocity: ~30% faster development (safer changes)
- Developer satisfaction: Higher (less firefighting)

## Exercise: Create Your Roadmap

### Task

1. Run the complete analysis pipeline (Guides 1-5)
2. Review the business roadmap
3. Create a phased modernization plan
4. Answer these questions:

**Questions:**
- Which files have the highest value scores?
- Which quarter has the most critical dependency on modernization?
- What is the total estimated modernization effort?
- What is the ROI (business value vs. time investment)?

### Expected Results

<details>
<summary>Click to reveal expected results</summary>

**Highest value scores:**
1. order-processor.ts (10.61)
2. email-notifier.ts (7.33)
3. pricing-engine.ts (5.96)

**Critical quarter:**
- **Q2** - Subscription feature ($500K ARR) absolutely requires order-processor.ts refactoring

**Total modernization effort:**
- Phase 1 (pricing-engine): 1.5 weeks
- Phase 3 (order-processor): 3 weeks
- Phase 5 (email-notifier): 3 weeks
- **Total:** 7.5 weeks

**ROI:**
- **Investment:** 7.5 weeks modernization
- **Returns:**
  - Subscription feature enabled: $500K ARR
  - Reduced bugs: ~50% fewer fixes (saves ~2 weeks/quarter)
  - Faster feature development: ~30% velocity increase
  - Safe foundation for future features

**Break-even:** < 2 quarters (subscription revenue alone covers investment)

</details>

## Key Takeaways

### ✅ Do This

1. **Align with business value** - modernize files blocking high-value features
2. **Phase work strategically** - modernize just before features need it
3. **Calculate ROI** - justify modernization with business outcomes
4. **Choose appropriate strategies** - rewrite vs. refactor based on context
5. **Measure success** - track bug rates, velocity, coverage trends

### ❌ Don't Do This

1. **Modernize everything** - wastes time on stable code
2. **Perfect before shipping** - delays revenue-generating features
3. **Ignore business context** - technical purity without business value
4. **Underestimate effort** - refactoring takes time, plan accordingly
5. **Skip testing** - characterization tests are mandatory safety net

## Tools and Techniques Summary

Throughout this session, you learned to use:

**Analysis Tools:**
- Git log parsing for change frequency
- TypeScript AST analysis for complexity
- Jest coverage reports for test gaps
- Combined metrics for hotspot detection
- Feature mapping for value prioritization

**Decision Frameworks:**
- Risk formula: `(Complexity × Changes × CoverageGap) + (Bugs × 10)`
- Value formula: `(RiskReduction + FeatureEnablement) / Effort`
- Strategy selection: Rewrite vs. Refactor vs. Incremental

**Outputs:**
- change-frequency.json
- complexity-analysis.json
- coverage-analysis.json
- hotspot-analysis.json
- value-analysis.json
- Modernization roadmap (phased plan)

## Conclusion

Data-driven modernization strategy enables you to:
- **Measure** technical debt objectively
- **Prioritize** work by business value
- **Justify** modernization investment with ROI
- **Plan** phased approaches aligned with roadmap
- **Execute** confidently with metrics tracking progress

This approach transforms legacy modernization from "we should clean this up someday" to "investing 3 weeks in order-processor.ts enables $500K subscription revenue in Q2."

---

**Congratulations!** You've completed the data-driven modernization analysis. You now have the skills to:
- Identify technical debt hotspots
- Map debt to business impact
- Create value-driven roadmaps
- Justify modernization investment

**Next steps:**
- Apply these techniques to your own codebase
- Present analysis to stakeholders with business framing
- Execute phased modernization aligned with feature roadmap
- Track metrics to measure improvement over time
