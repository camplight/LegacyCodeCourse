# Session 4 Workshop Goals

## Workshop Objective

Learn to make **data-driven modernization decisions** by combining quantitative codebase analysis with business value alignment. Transform subjective opinions ("this code is messy") into objective prioritization ("order-processor.ts scores 384 risk points and blocks $500K subscription feature").

## What You Will Build

During this workshop, you will create a complete analysis pipeline:

1. **Change frequency analyzer** - Identifies maintenance hotspots from git history
2. **Complexity calculator** - Measures cognitive load using cyclomatic complexity
3. **Coverage analyzer** - Identifies untested code from Jest reports
4. **Hotspot detector** - Combines metrics into unified risk scores
5. **Value mapper** - Aligns technical debt with business roadmap
6. **Modernization roadmap** - Phased plan with ROI justification

## Pre-Workshop Setup (15 minutes before session)

### 1. Verify Node.js Installation
```bash
node --version  # Should be v18 or higher
npm --version
```

### 2. Install Legacy System
```bash
cd session-4/legacy-system
npm install
npm run build
npm test
```

**✅ Success criteria:**
- Build completes without errors
- Some tests pass (~10-15 tests)
- Coverage shows ~40-50% overall

### 3. Create Git History
```bash
cd session-4/scripts
./create-git-history.sh
```

**✅ Success criteria:**
- Script completes successfully
- `git log --oneline | wc -l` shows ~60 commits
- Commits span from Feb 2024 to Feb 2025

### 4. Review Business Context
```bash
cat session-4/business-roadmap.md
```

**✅ Success criteria:**
- Understand Q1-Q3 2024 features
- Note high-value features (subscriptions: $500K ARR)
- Recognize which files are mentioned

## Workshop Exercises

### Exercise 1: Change Frequency Analysis (25 min)

**Objective:** Identify which files change most frequently, revealing maintenance burden.

**Reference:** `analysis-guides/1-change-frequency-analysis.md`

**Tasks:**
1. Create `analyze-changes.js` script following the guide
2. Parse git log to count changes per file
3. Separate feature commits from bug fixes
4. Output results to `change-frequency.json`

**Questions to answer:**
- Which file has the highest total changes?
- Which file has the highest bug-fix ratio?
- Which files are stable (changed ≤3 times)?

**Expected Results:**
```
File                    Changes  Features  Bugs  Bug%
-------------------------------------------------------
email-notifier.ts          22       8      14   63.6%
order-processor.ts         18      12       6   33.3%
pricing-engine.ts          12       8       4   33.3%
inventory-manager.ts        4       4       0    0.0%
payment-gateway.ts          3       3       0    0.0%
shipping-calculator.ts      2       2       0    0.0%
```

**Key Insight:** email-notifier.ts has 63.6% bug ratio - most changes are fixes, not features!

---

### Exercise 2: Complexity Analysis (25 min)

**Objective:** Calculate cyclomatic complexity to identify cognitively complex code.

**Reference:** `analysis-guides/2-complexity-metrics.md`

**Tasks:**
1. Install @typescript-eslint/parser
2. Create `analyze-complexity.js` script
3. Parse TypeScript AST to calculate complexity
4. Output file-level and function-level complexity

**Questions to answer:**
- Which file has the highest maximum complexity?
- Which functions have complexity >15?
- What is the average complexity per file?

**Expected Results:**
```
Function                 Complexity  File
-----------------------------------------------
finalizeOrder                18      order-processor.ts
applyDiscounts               16      order-processor.ts
calculateShipping            14      pricing-engine.ts
validateOrder                12      order-processor.ts
```

**Key Insight:** order-processor.ts has multiple high-complexity functions (god class anti-pattern).

---

### Exercise 3: Test Coverage Analysis (20 min)

**Objective:** Identify untested code using Jest coverage reports.

**Reference:** `analysis-guides/3-test-coverage-analysis.md`

**Tasks:**
1. Run `npm run test:coverage` to generate coverage data
2. Create `analyze-coverage.js` script
3. Parse `coverage/coverage-final.json`
4. Identify files with 0% coverage

**Questions to answer:**
- Which files have 0% coverage?
- Which file has partial coverage (<80%)?
- What is overall system coverage?

**Expected Results:**
```
File                      Stmts  Branch  Funcs  Overall
---------------------------------------------------------
order-processor.ts          0%      0%     0%       0%
email-notifier.ts           0%      0%     0%       0%
pricing-engine.ts          72%     66%    78%      72%
shipping-calculator.ts     98%     92%   100%      97%
inventory-manager.ts      100%    100%   100%     100%
payment-gateway.ts         95%     89%   100%      95%
```

**Key Insight:** Two critical files (order-processor, email-notifier) have zero tests!

---

### Exercise 4: Hotspot Detection (30 min)

**Objective:** Combine all metrics to identify highest-risk files.

**Reference:** `analysis-guides/4-hotspot-detection.md`

**Tasks:**
1. Load data from previous exercises
2. Create `detect-hotspots.js` script
3. Calculate risk scores using formula:
   ```
   Risk = (Complexity × Changes × CoverageGap) + (Bugs × 10)
   ```
4. Classify files by risk level

**Questions to answer:**
- Which files are in the critical risk category (score >= 300)?
- What are the top 3 files by risk score?
- How does risk correlate with each individual metric?

**Expected Results:**
```
File                    Risk  Complexity  Changes  Coverage  Bugs
--------------------------------------------------------------------
order-processor.ts       384      18        18        0%      6
email-notifier.ts        200       8        22        0%     14
pricing-engine.ts         87      14        12       72%      4
shipping-calculator.ts     0       5         2       97%      0
inventory-manager.ts       0       6         4      100%      0
payment-gateway.ts         0       7         3       95%      0
```

**Key Insight:** Two files (order-processor, email-notifier) are critically risky - high complexity/changes + zero tests.

---

### Exercise 5: Value-Driven Prioritization (30 min)

**Objective:** Align technical debt with business value to create an ROI-driven roadmap.

**Reference:** `analysis-guides/5-modernization-roadmap.md`

**Tasks:**
1. Review `business-roadmap.md` for upcoming features
2. Map features to impacted files
3. Calculate business value per file
4. Create `map-features.js` script
5. Calculate value scores:
   ```
   Value = (RiskReduction + FeatureEnablement) / Effort
   ```
6. Create phased modernization roadmap

**Questions to answer:**
- Which files have the highest value scores?
- Which quarter depends most on modernization?
- What is the total modernization effort estimate?
- What is the ROI (business value vs. time)?

**Expected Results:**
```
File                    Value  Risk  BizValue  Effort  Features
------------------------------------------------------------------
order-processor.ts      10.61   384     28      3w        4
email-notifier.ts        7.33   200     11      3w        2
pricing-engine.ts        5.96    87     15    1.5w        3
payment-gateway.ts       4.80     0     24    0.5w        3
inventory-manager.ts     1.00     0     10    0.5w        1
shipping-calculator.ts   0.80     0      4    0.5w        1
```

**Phased Plan:**
- **Phase 1 (Pre-Q1):** pricing-engine.ts - 1.5 weeks
- **Phase 2 (Q1):** Implement Q1 features - 4 weeks
- **Phase 3 (Pre-Q2):** order-processor.ts refactoring - 3 weeks
- **Phase 4 (Q2):** Implement Q2 features (subscriptions!) - 8 weeks
- **Phase 5 (Pre-Q3):** email-notifier.ts rewrite - 3 weeks
- **Phase 6 (Q3):** Implement Q3 features - 4 weeks

**Total:** 7.5 weeks modernization + 16 weeks features = 23.5 weeks

**ROI:**
- **Investment:** 7.5 weeks modernization
- **Returns:**
  - Subscriptions enabled: $500K ARR (blocked without refactoring!)
  - Reduced bugs: ~50% fewer fixes
  - Faster development: ~30% velocity increase
  - Technical foundation for future features

**Key Insight:** 7.5 weeks investment enables $500K subscription revenue - clear ROI!

---

## Final Deliverable: Modernization Roadmap Presentation

### Format

Create a 5-minute presentation covering:

1. **Technical Analysis Summary**
   - Hotspots identified (order-processor: 384, email-notifier: 200)
   - Risk factors (complexity, changes, coverage, bugs)

2. **Business Alignment**
   - Q2 subscriptions feature: $500K ARR opportunity
   - Blocked by order-processor.ts risk
   - Other features impacted

3. **Modernization Plan**
   - Phase 1: pricing-engine (1.5w) - enables Q1 features
   - Phase 3: order-processor (3w) - unblocks Q2 subscriptions
   - Phase 5: email-notifier (3w) - enables Q3 email features
   - Total: 7.5 weeks investment

4. **ROI Justification**
   - Direct: $500K subscription revenue enabled
   - Indirect: Reduced bugs, faster velocity, safer changes
   - Break-even: <2 quarters

5. **Recommendation**
   - Approve Phase 1 immediately (enables Q1)
   - Schedule Phase 3 for April (before Q2 subscriptions)
   - Monitor metrics to track improvement

### Success Criteria

Your roadmap should:
- ✅ Be based on quantitative data (not opinions)
- ✅ Align technical work with business features
- ✅ Show clear ROI (value vs. cost)
- ✅ Be phased (not "big bang" rewrite)
- ✅ Be actionable (specific files, specific weeks)
- ✅ Be compelling to non-technical stakeholders

## Post-Workshop: Applying to Your Codebase

### Week 1: Data Collection
- Run change frequency analysis on your repository
- Calculate complexity metrics
- Generate coverage reports
- Create hotspot analysis

### Week 2: Business Mapping
- Document upcoming features (next 2-3 quarters)
- Map features to codebase files
- Assign business value scores
- Identify blockers

### Week 3: Roadmap Creation
- Calculate value/effort scores
- Prioritize highest-value work
- Phase modernization before feature quarters
- Present to stakeholders with ROI

### Ongoing: Execution and Tracking
- Start with characterization tests
- Refactor highest-value files
- Track metrics monthly:
  - Test coverage trend
  - Cyclomatic complexity trend
  - Bug rate trend
  - Feature velocity trend

## Key Takeaways

### What You Learned

1. **Data-driven analysis beats intuition**
   - "This code is bad" → "This file scores 384 risk points"
   - Quantifiable, defensible, actionable

2. **Business alignment is critical**
   - Technical debt only matters if it blocks business value
   - Prioritize by ROI, not by "messiness"

3. **Phased approaches are safer**
   - Don't rewrite everything at once
   - Modernize just before features need it
   - Maintain working software throughout

4. **Multiple strategies exist**
   - Characterization tests for safety
   - Extract & refactor for core logic
   - Rewrite for structural failures
   - Incremental for partial modernization

5. **Metrics enable improvement**
   - Track coverage, complexity, bug rate
   - Measure velocity improvements
   - Demonstrate ROI to stakeholders

### What to Avoid

❌ **Modernizing everything** - Wastes time on stable code
❌ **Ignoring business context** - Technical purity without value
❌ **Big bang rewrites** - High risk, long delays
❌ **Skipping tests** - No safety net for changes
❌ **Guessing priorities** - Use data, not opinions

### What to Do Next

✅ **Run analysis on your codebase**
✅ **Map to your roadmap**
✅ **Calculate ROI**
✅ **Present to stakeholders**
✅ **Execute phased plan**
✅ **Track metrics**
✅ **Iterate and improve**

## Resources for Continued Learning

### Books
- "Software Design X-Rays" - Adam Tornhill (change frequency analysis)
- "Working Effectively with Legacy Code" - Michael Feathers
- "Refactoring" - Martin Fowler

### Tools
- **CodeScene** - Commercial change frequency & complexity analysis
- **SonarQube** - Static analysis and coverage tracking
- **Coveralls** / **Codecov** - Coverage tracking over time

### Techniques
- **Characterization Testing** (Session 1 of this course)
- **Isolation Patterns** (Session 2 of this course)
- **Strangler Fig Pattern** - Gradual replacement
- **Branch by Abstraction** - Parallel implementations

## Workshop Success Checklist

By the end of the workshop, you should have:

- ✅ Created change frequency analyzer
- ✅ Created complexity calculator
- ✅ Created coverage analyzer
- ✅ Created hotspot detector
- ✅ Mapped features to files
- ✅ Calculated value scores
- ✅ Created phased modernization roadmap
- ✅ Presented ROI-justified plan

**Congratulations!** You now have the skills to make data-driven modernization decisions and align technical work with business value. Apply these techniques to your codebase and watch your velocity improve while risk decreases.
