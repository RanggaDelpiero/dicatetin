# AI Premium Finance and UI UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Dicatetin/Pundi from a manual finance tracker with AI chat into a proactive AI personal finance operating system with a fully redesigned mobile-first UI/UX.

**Architecture:** Keep the current local-first Next.js 16 App Router architecture, Zustand stores, and server-only AI proxy pattern. Add pure financial intelligence modules in `lib/finance/` and `lib/ai/`, persist derived AI artifacts in focused stores, and expose AI actions through new server route handlers under `app/api/ai/`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, Zustand persist, Vitest, Framer Motion, Phosphor Icons, existing `openagentic.id` AI proxy.

---

## Scope And Sequencing

This is a large product program, so implement it in independently shippable chunks:

1. **Foundation:** shared analytics, AI schemas, privacy-safe context, design tokens.
2. **Highest-priority AI:** AI Financial Autopilot, cash-flow forecast, AI budget coach, smart categorization, recurring/subscription detector.
3. **Premium AI:** financial health score, goal planner, what-if simulator, anomaly detection, weekly/monthly AI review.
4. **Total UI/UX overhaul:** new shell, dashboard, AI command center, transaction flows, analytics views, accessibility, motion, visual polish.

Do not start with UI decoration. The new UI should be powered by reliable finance modules first.

---

## File Structure Map

### Create

- `lib/finance/periods.ts` - reusable date range helpers for day/week/month/custom periods.
- `lib/finance/cash-flow.ts` - deterministic cash-flow forecast from income, recurring expense, debts, card due dates, and budgets.
- `lib/finance/financial-health.ts` - financial health score calculation and factor breakdown.
- `lib/finance/anomaly-detection.ts` - local rule-based anomaly detection before AI summarization.
- `lib/finance/recurring-detector.ts` - local detector for likely subscriptions and repeated merchants.
- `lib/finance/what-if.ts` - deterministic scenario simulator.
- `lib/ai/schemas.ts` - strict request/response TypeScript types for AI planner/report outputs.
- `lib/ai/prompts.ts` - prompts for coach, review, categorization, and autopilot summaries.
- `lib/ai/client.ts` - server-only helper for calling the existing AI provider.
- `lib/ai/sanitize.ts` - strips raw sensitive fields from AI payloads.
- `lib/stores/intelligence-store.ts` - persisted AI insights, alerts, reports, accepted suggestions.
- `lib/stores/preferences-store.ts` - UI density, privacy mode, theme, AI proactivity settings.
- `components/intelligence/AutopilotFeed.tsx` - proactive insight feed.
- `components/intelligence/CashFlowForecastCard.tsx` - forecast chart/card.
- `components/intelligence/HealthScoreCard.tsx` - score + factor breakdown.
- `components/intelligence/WhatIfSimulator.tsx` - scenario inputs and results.
- `components/intelligence/GoalPlannerSheet.tsx` - AI-assisted goal planning flow.
- `components/intelligence/AIReviewCard.tsx` - weekly/monthly report display.
- `components/shell/AppShell.tsx` - redesigned app shell with safe-area layout and tab structure.
- `components/shell/TopBar.tsx` - compact contextual header.
- `components/shell/CommandBar.tsx` - AI-first command/search entry point.
- `components/ui/Button.tsx` - accessible token-driven button.
- `components/ui/IconButton.tsx` - accessible icon button with minimum tap target.
- `components/ui/Card.tsx` - flat, compact app card primitive.
- `components/ui/SegmentedControl.tsx` - period and mode selector.
- `components/ui/MetricTile.tsx` - stable financial metric tile.
- `components/ui/EmptyState.tsx` - consistent empty state.
- `components/ui/Skeleton.tsx` - loading skeleton.
- `components/ui/Toast.tsx` - undo/retry/status feedback.
- `components/charts/CashFlowChart.tsx` - accessible forecast line/bar visualization.
- `components/charts/CategoryTrendChart.tsx` - category trend chart.
- `app/(main)/intelligence/page.tsx` - new AI command center.
- `app/(main)/analytics/page.tsx` - advanced analytics and review hub.
- `app/api/ai/autopilot/route.ts` - AI insight summarization.
- `app/api/ai/budget-coach/route.ts` - AI budget suggestions.
- `app/api/ai/categorize/route.ts` - merchant/note categorization.
- `app/api/ai/review/route.ts` - weekly/monthly narrative review.
- `app/api/ai/goal-plan/route.ts` - goal planning recommendations.
- `lib/finance/*.test.ts` - unit tests for every pure finance module.
- `lib/ai/*.test.ts` - schema/sanitization/prompt tests.

### Modify

- `lib/types.ts` - add `AIInsight`, `FinancialAlert`, `CashFlowProjection`, `DetectedRecurring`, `FinancialGoalPlan`, `WhatIfScenario`, `UserPreference`.
- `lib/ai/context.ts` - expand context safely with forecast, budget, recurring, debt pressure, and anomaly summaries.
- `app/api/advisor/route.ts` - reuse new `lib/ai/client.ts` and schema parsing.
- `lib/stores/transaction-store.ts` - add merchant normalization metadata and optional AI category confidence.
- `lib/stores/budget-store.ts` - replace average-week logic with actual period helpers.
- `lib/stores/goal-store.ts` - attach AI-generated saving plans to goals.
- `lib/stores/recurring-store.ts` - reconcile user-created recurring items with detected recurring candidates.
- `app/globals.css` - rebuild tokens, typography roles, motion tokens, surfaces, focus rings, privacy mode.
- `app/(main)/layout.tsx` - swap current layout for new `AppShell`.
- `app/(main)/dashboard/page.tsx` - rebuild as compact command-center dashboard.
- `app/(main)/advisor/page.tsx` - reposition as conversational AI with action cards.
- `app/(main)/transactions/page.tsx` - improve scanability, filters, search, anomaly flags.
- `components/transactions/AddTransactionSheet.tsx` - add AI categorization, confidence, and merchant memory.
- `components/ui/BottomTabBar.tsx` - reduce to primary destinations and improve touch/accessibility.
- `components/charts/DonutChart.tsx` - add text alternative and token-based colors.
- `PRD.md` - add new feature requirements after implementation.
- `Design.md` - replace old component guidance with the new UI system.

---

## Chunk 1: Finance Intelligence Foundation

### Task 1: Period Helpers

**Files:**
- Create: `lib/finance/periods.ts`
- Test: `lib/finance/periods.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- current month uses actual calendar days.
- week range starts Monday for Indonesian usage.
- custom range rejects end before start.
- date-only comparisons do not shift due to timezone.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- lib/finance/periods.test.ts`

Expected: FAIL because `lib/finance/periods.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Export:
- `toDateKey(date: Date | string): string`
- `getMonthPeriod(date: Date): { start: string; end: string; days: number }`
- `getWeekPeriod(date: Date): { start: string; end: string }`
- `getDaysBetween(start: string, end: string): string[]`
- `assertValidPeriod(start: string, end: string): void`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- lib/finance/periods.test.ts`

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/finance/periods.ts lib/finance/periods.test.ts
git commit -m "feat: add finance period helpers"
```

### Task 2: Safe AI Schemas And Sanitization

**Files:**
- Create: `lib/ai/schemas.ts`
- Create: `lib/ai/sanitize.ts`
- Test: `lib/ai/sanitize.test.ts`
- Modify: `lib/ai/context.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- raw transaction notes are not sent unless summarized.
- receipt image URLs are removed.
- wallet names are allowed but API keys/user ids are never present.
- category totals, recurring summaries, and debt pressure summaries are retained.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- lib/ai/sanitize.test.ts`

- [ ] **Step 3: Implement schema types**

Add types:
- `AIInsightKind`
- `AIInsightSeverity`
- `AIInsight`
- `FinancialAlert`
- `AIActionSuggestion`
- `AIReviewResponse`
- `BudgetCoachResponse`
- `GoalPlanResponse`
- `CategorizationResponse`

- [ ] **Step 4: Implement sanitizer**

Implement `buildSanitizedAIPayload(input)` as a pure function. It should accept aggregate app state and return only:
- period summary,
- totals,
- category breakdown,
- trend deltas,
- recurring summaries,
- debt/card pressure,
- goal progress,
- anomaly summaries.

- [ ] **Step 5: Update `buildFinancialContext`**

Keep the existing natural-language context, but add optional sections for:
- cash-flow forecast,
- financial health score,
- upcoming recurring/subscription items,
- detected anomalies,
- active AI recommendations.

- [ ] **Step 6: Run tests**

Run: `npm.cmd test -- lib/ai/sanitize.test.ts`

- [ ] **Step 7: Commit**

Run:
```bash
git add lib/ai/schemas.ts lib/ai/sanitize.ts lib/ai/sanitize.test.ts lib/ai/context.ts
git commit -m "feat: add privacy-safe AI payload schemas"
```

### Task 3: Shared AI Client

**Files:**
- Create: `lib/ai/client.ts`
- Create: `lib/ai/prompts.ts`
- Modify: `app/api/advisor/route.ts`
- Test: `lib/ai/client.test.ts`

- [ ] **Step 1: Write failing tests**

Mock `fetch` and verify:
- API key is read server-side only.
- rate-limit returns typed error.
- markdown code fences are stripped before JSON parsing.
- streaming-style `data:` lines are accumulated.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- lib/ai/client.test.ts`

- [ ] **Step 3: Implement `callAIChatCompletion`**

Use `BASE_URL`, `API_KEY`, and `MODEL` from env. Return:
- `{ ok: true, content: string }`
- `{ ok: false, status: number, message: string }`

- [ ] **Step 4: Refactor advisor route**

Keep the public behavior identical, but move provider-specific parsing out of the route.

- [ ] **Step 5: Run tests and build**

Run:
```bash
npm.cmd test -- lib/ai/client.test.ts
npm.cmd run build
```

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/ai/client.ts lib/ai/prompts.ts app/api/advisor/route.ts lib/ai/client.test.ts
git commit -m "refactor: centralize AI provider client"
```

---

## Chunk 2: Highest-Priority AI Features

### Task 4: Cash-Flow Forecast

**Files:**
- Create: `lib/finance/cash-flow.ts`
- Create: `lib/finance/cash-flow.test.ts`
- Create: `components/intelligence/CashFlowForecastCard.tsx`
- Create: `components/charts/CashFlowChart.tsx`
- Modify: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Write failing finance tests**

Cover:
- starting balance plus scheduled income minus recurring expense.
- credit card due dates reduce projected available cash.
- debts with due dates reduce projection.
- daily budget burn can be included or excluded.
- projection returns 7, 14, and 30 day series.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- lib/finance/cash-flow.test.ts`

- [ ] **Step 3: Implement `buildCashFlowProjection`**

Inputs:
- wallets,
- transactions,
- recurring transactions,
- debts,
- credit-card wallets,
- budgets,
- date.

Output:
- `currentBalance`
- `projectedBalance`
- `lowestProjectedBalance`
- `riskLevel`
- `events[]`
- `series[]`

- [ ] **Step 4: Add forecast UI**

Add a compact card to dashboard below daily budget:
- 7/14/30 segmented control.
- lowest balance warning.
- event list for upcoming income/expense.
- accessible chart summary text.

- [ ] **Step 5: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/cash-flow.test.ts
npm.cmd run build
```

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/finance/cash-flow.ts lib/finance/cash-flow.test.ts components/intelligence/CashFlowForecastCard.tsx components/charts/CashFlowChart.tsx "app/(main)/dashboard/page.tsx"
git commit -m "feat: add cash flow forecast"
```

### Task 5: AI Financial Autopilot

**Files:**
- Create: `lib/stores/intelligence-store.ts`
- Create: `components/intelligence/AutopilotFeed.tsx`
- Create: `app/api/ai/autopilot/route.ts`
- Modify: `app/(main)/dashboard/page.tsx`
- Modify: `app/(main)/advisor/page.tsx`

- [ ] **Step 1: Write store tests**

Cover:
- add/update/dismiss insight.
- accepted suggestion is persisted.
- dismissed insight does not reappear unless data signature changes.

- [ ] **Step 2: Implement local insight generation**

Before calling AI, generate deterministic candidates:
- overspending vs budget,
- cash-flow risk,
- category spike,
- upcoming due date,
- recurring charge,
- positive achievement.

- [ ] **Step 3: Implement AI route**

`POST /api/ai/autopilot` accepts sanitized payload and local candidates. It returns 3-5 concise Indonesian insight cards with:
- title,
- explanation,
- severity,
- suggested action,
- destination link.

- [ ] **Step 4: Add feed UI**

Show Autopilot feed on dashboard and AI page. It should support:
- dismiss,
- mark as done,
- open related screen,
- retry when AI fails.

- [ ] **Step 5: Run verification**

Run:
```bash
npm.cmd test -- lib/stores/intelligence-store.test.ts
npm.cmd run build
```

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/stores/intelligence-store.ts components/intelligence/AutopilotFeed.tsx app/api/ai/autopilot/route.ts "app/(main)/dashboard/page.tsx" "app/(main)/advisor/page.tsx"
git commit -m "feat: add AI financial autopilot"
```

### Task 6: AI Budget Coach

**Files:**
- Create: `app/api/ai/budget-coach/route.ts`
- Create: `components/intelligence/BudgetCoachSheet.tsx`
- Modify: `lib/stores/budget-store.ts`
- Modify: `components/budget/BudgetSettingsSheet.tsx`
- Test: `lib/stores/budget-store.test.ts`

- [ ] **Step 1: Fix budget math tests**

Budget weekly must be `dailyBudget * 7` using actual days in month, not monthly divided by 4.33.

- [ ] **Step 2: Implement coach route**

Budget coach returns:
- suggested monthly budget per category,
- reasoning,
- confidence,
- strictness mode: `hemat`, `normal`, `agresif_nabung`,
- warnings if total budget exceeds income.

- [ ] **Step 3: Add review-before-apply UI**

User must review suggestions and apply individually or all at once. Never auto-change budgets.

- [ ] **Step 4: Run verification**

Run:
```bash
npm.cmd test -- lib/stores/budget-store.test.ts
npm.cmd run build
```

- [ ] **Step 5: Commit**

Run:
```bash
git add app/api/ai/budget-coach/route.ts components/intelligence/BudgetCoachSheet.tsx lib/stores/budget-store.ts components/budget/BudgetSettingsSheet.tsx lib/stores/budget-store.test.ts
git commit -m "feat: add AI budget coach"
```

### Task 7: Smart Categorization And Merchant Memory

**Files:**
- Create: `app/api/ai/categorize/route.ts`
- Create: `lib/finance/merchant.ts`
- Create: `lib/finance/merchant.test.ts`
- Modify: `lib/types.ts`
- Modify: `lib/stores/transaction-store.ts`
- Modify: `components/transactions/AddTransactionSheet.tsx`

- [ ] **Step 1: Write merchant normalization tests**

Examples:
- `KOPI KENANGAN - MALL ABC` -> `kopi kenangan`
- `GrabFood*12345` -> `grabfood`
- blank note returns null.

- [ ] **Step 2: Add transaction metadata**

Add optional:
- `merchantName`
- `merchantKey`
- `aiSuggestedCategoryId`
- `aiCategoryConfidence`
- `categorizationSource`

- [ ] **Step 3: Implement local rule first**

When merchant has prior accepted category, suggest it immediately without AI call.

- [ ] **Step 4: Implement AI fallback**

Call `/api/ai/categorize` only when local memory has no high-confidence result.

- [ ] **Step 5: Add UI**

In add/edit transaction:
- show suggested category chip,
- show confidence indicator,
- let user accept/change,
- save accepted mapping.

- [ ] **Step 6: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/merchant.test.ts
npm.cmd run build
```

- [ ] **Step 7: Commit**

Run:
```bash
git add app/api/ai/categorize/route.ts lib/finance/merchant.ts lib/finance/merchant.test.ts lib/types.ts lib/stores/transaction-store.ts components/transactions/AddTransactionSheet.tsx
git commit -m "feat: add smart transaction categorization"
```

### Task 8: Subscription And Recurring Detector

**Files:**
- Create: `lib/finance/recurring-detector.ts`
- Create: `lib/finance/recurring-detector.test.ts`
- Create: `components/intelligence/RecurringDetectorCard.tsx`
- Modify: `lib/stores/recurring-store.ts`
- Modify: `app/(main)/transactions/recurring/page.tsx`
- Modify: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Write detector tests**

Cover:
- same merchant and similar amount monthly is detected.
- weekly pattern is detected.
- one-off repeated category is not treated as subscription without merchant consistency.
- user dismissed candidate stays dismissed.

- [ ] **Step 2: Implement detector**

Return candidates with:
- merchant,
- amount range,
- cadence,
- next expected date,
- confidence,
- matched transaction ids.

- [ ] **Step 3: Add reconciliation**

Let user convert candidate into an existing recurring transaction entry.

- [ ] **Step 4: Add dashboard warning**

If upcoming subscription charge threatens cash-flow, add an Autopilot candidate.

- [ ] **Step 5: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/recurring-detector.test.ts
npm.cmd run build
```

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/finance/recurring-detector.ts lib/finance/recurring-detector.test.ts components/intelligence/RecurringDetectorCard.tsx lib/stores/recurring-store.ts "app/(main)/transactions/recurring/page.tsx" "app/(main)/dashboard/page.tsx"
git commit -m "feat: detect recurring subscriptions"
```

---

## Chunk 3: Premium AI Features

### Task 9: Financial Health Score

**Files:**
- Create: `lib/finance/financial-health.ts`
- Create: `lib/finance/financial-health.test.ts`
- Create: `components/intelligence/HealthScoreCard.tsx`
- Modify: `app/(main)/dashboard/page.tsx`
- Modify: `app/(main)/analytics/page.tsx`

- [ ] **Step 1: Write score tests**

Factors:
- saving rate,
- budget discipline,
- debt pressure,
- emergency coverage proxy,
- cash-flow stability,
- logging consistency.

- [ ] **Step 2: Implement score**

Output:
- score 0-100,
- grade,
- factor breakdown,
- top improvement action,
- positive reinforcement.

- [ ] **Step 3: Add UI**

Show score as a compact card on dashboard and detailed breakdown in analytics.

- [ ] **Step 4: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/financial-health.test.ts
npm.cmd run build
```

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/finance/financial-health.ts lib/finance/financial-health.test.ts components/intelligence/HealthScoreCard.tsx "app/(main)/dashboard/page.tsx" "app/(main)/analytics/page.tsx"
git commit -m "feat: add financial health score"
```

### Task 10: AI Goal Planner

**Files:**
- Create: `app/api/ai/goal-plan/route.ts`
- Create: `components/intelligence/GoalPlannerSheet.tsx`
- Modify: `lib/types.ts`
- Modify: `lib/stores/goal-store.ts`
- Modify: `app/(main)/goals/page.tsx`

- [ ] **Step 1: Add goal plan type**

Add:
- target amount,
- deadline,
- required daily/weekly/monthly saving,
- recommended source categories,
- milestones,
- risk message.

- [ ] **Step 2: Write store tests**

Cover attach/update/remove plan from goal.

- [ ] **Step 3: Implement AI route**

Return plan options:
- relaxed,
- balanced,
- aggressive.

- [ ] **Step 4: Add UI**

From goal detail, user taps AI plan, reviews options, and applies one.

- [ ] **Step 5: Run verification**

Run:
```bash
npm.cmd test -- lib/stores/goal-store.test.ts
npm.cmd run build
```

- [ ] **Step 6: Commit**

Run:
```bash
git add app/api/ai/goal-plan/route.ts components/intelligence/GoalPlannerSheet.tsx lib/types.ts lib/stores/goal-store.ts "app/(main)/goals/page.tsx"
git commit -m "feat: add AI goal planner"
```

### Task 11: What-If Simulator

**Files:**
- Create: `lib/finance/what-if.ts`
- Create: `lib/finance/what-if.test.ts`
- Create: `components/intelligence/WhatIfSimulator.tsx`
- Modify: `app/(main)/intelligence/page.tsx`

- [ ] **Step 1: Write simulator tests**

Scenarios:
- reduce category spending by amount/percentage.
- add recurring expense.
- add debt payment.
- increase income.
- compare projected savings and cash-flow risk.

- [ ] **Step 2: Implement pure simulator**

No AI needed for calculation. AI can later explain results, but math stays deterministic.

- [ ] **Step 3: Add UI**

Use sliders/steppers for numeric values and segmented control for scenario type.

- [ ] **Step 4: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/what-if.test.ts
npm.cmd run build
```

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/finance/what-if.ts lib/finance/what-if.test.ts components/intelligence/WhatIfSimulator.tsx "app/(main)/intelligence/page.tsx"
git commit -m "feat: add what-if finance simulator"
```

### Task 12: Anomaly Detection

**Files:**
- Create: `lib/finance/anomaly-detection.ts`
- Create: `lib/finance/anomaly-detection.test.ts`
- Create: `components/intelligence/AnomalyBadge.tsx`
- Modify: `app/(main)/transactions/page.tsx`
- Modify: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Write anomaly tests**

Detect:
- unusually large transaction for category,
- duplicate transaction in short window,
- wallet negative balance,
- category spike week-over-week,
- unusual merchant.

- [ ] **Step 2: Implement detector**

Return severity and human-readable reason. Keep thresholds conservative to avoid noisy alerts.

- [ ] **Step 3: Add UI**

Show anomaly badges on transaction list and summarize serious anomalies in Autopilot.

- [ ] **Step 4: Run verification**

Run:
```bash
npm.cmd test -- lib/finance/anomaly-detection.test.ts
npm.cmd run build
```

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/finance/anomaly-detection.ts lib/finance/anomaly-detection.test.ts components/intelligence/AnomalyBadge.tsx "app/(main)/transactions/page.tsx" "app/(main)/dashboard/page.tsx"
git commit -m "feat: add financial anomaly detection"
```

### Task 13: Weekly And Monthly AI Review

**Files:**
- Create: `app/api/ai/review/route.ts`
- Create: `components/intelligence/AIReviewCard.tsx`
- Modify: `lib/stores/intelligence-store.ts`
- Modify: `app/(main)/analytics/page.tsx`
- Modify: `components/insights/InsightsCarousel.tsx`

- [ ] **Step 1: Add review state**

Persist generated reviews by period key:
- `week:YYYY-WW`
- `month:YYYY-MM`

- [ ] **Step 2: Implement AI route**

Return:
- headline,
- wins,
- risks,
- top category movement,
- one recommended action,
- next week/month target.

- [ ] **Step 3: Add UI**

Analytics page shows review history. Dashboard shows only latest review teaser.

- [ ] **Step 4: Run verification**

Run:
```bash
npm.cmd run build
```

- [ ] **Step 5: Commit**

Run:
```bash
git add app/api/ai/review/route.ts components/intelligence/AIReviewCard.tsx lib/stores/intelligence-store.ts "app/(main)/analytics/page.tsx" components/insights/InsightsCarousel.tsx
git commit -m "feat: add AI weekly and monthly reviews"
```

---

## Chunk 4: Total UI/UX Overhaul

### Task 14: Design Tokens And Base UI Primitives

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/IconButton.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/SegmentedControl.tsx`
- Create: `components/ui/MetricTile.tsx`
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ui/Skeleton.tsx`
- Create: `components/ui/Toast.tsx`

- [ ] **Step 1: Audit existing hardcoded visual classes**

Run:
```bash
rg "text-white|text-black|bg-gradient|#[0-9A-Fa-f]{6}|text-\\[" app components lib
```

Record risky usages before changing them.

- [ ] **Step 2: Rebuild tokens**

In `app/globals.css`, define:
- semantic surface tokens,
- text tokens,
- accent tokens,
- status tokens,
- chart tokens,
- focus ring token,
- shadow/elevation scale,
- radius scale,
- motion duration/easing variables,
- privacy mode classes.

- [ ] **Step 3: Build primitives**

All primitives must:
- use semantic tokens,
- keep 44px minimum touch target,
- support `aria-label` for icon-only controls,
- include focus-visible styles,
- avoid layout shift in pressed states.

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`

- [ ] **Step 5: Commit**

Run:
```bash
git add app/globals.css components/ui/Button.tsx components/ui/IconButton.tsx components/ui/Card.tsx components/ui/SegmentedControl.tsx components/ui/MetricTile.tsx components/ui/EmptyState.tsx components/ui/Skeleton.tsx components/ui/Toast.tsx
git commit -m "feat: add redesigned UI primitives"
```

### Task 15: New App Shell And Navigation

**Files:**
- Create: `components/shell/AppShell.tsx`
- Create: `components/shell/TopBar.tsx`
- Create: `components/shell/CommandBar.tsx`
- Modify: `app/(main)/layout.tsx`
- Modify: `components/ui/BottomTabBar.tsx`

- [ ] **Step 1: Define IA**

Use 5 primary destinations:
- Dashboard,
- Transaksi,
- Intelligence,
- Goals,
- Profile.

Move debts, wallets, recurring, backup, categories, and settings into contextual entry points and profile/settings menus.

- [ ] **Step 2: Implement shell**

Shell must:
- respect safe areas,
- reserve bottom-tab spacing,
- avoid nested scroll traps,
- provide one consistent top command entry,
- support dark/light/privacy modes.

- [ ] **Step 3: Update tab bar**

Use Phosphor icons, not emoji. Add selected state, screen-reader labels, and 44px hit areas.

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`

- [ ] **Step 5: Commit**

Run:
```bash
git add components/shell/AppShell.tsx components/shell/TopBar.tsx components/shell/CommandBar.tsx "app/(main)/layout.tsx" components/ui/BottomTabBar.tsx
git commit -m "feat: redesign app shell navigation"
```

### Task 16: Dashboard Redesign

**Files:**
- Modify: `app/(main)/dashboard/page.tsx`
- Create: `components/dashboard/DailyBudgetHero.tsx`
- Create: `components/dashboard/NetWorthStrip.tsx`
- Create: `components/dashboard/TodayActionStack.tsx`
- Create: `components/dashboard/WalletRail.tsx`
- Reuse: `components/intelligence/*`

- [ ] **Step 1: Split current large dashboard**

Extract focused components before changing behavior.

- [ ] **Step 2: New dashboard hierarchy**

Order:
1. Daily budget hero.
2. AI command bar/autopilot top action.
3. Cash-flow forecast.
4. Health score + net worth.
5. Today action stack.
6. Wallet rail.
7. Recent transactions.

- [ ] **Step 3: Remove decorative noise**

Avoid gradient/orb-heavy cards. Use compact, scannable, finance-app density.

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`

- [ ] **Step 5: Commit**

Run:
```bash
git add "app/(main)/dashboard/page.tsx" components/dashboard/DailyBudgetHero.tsx components/dashboard/NetWorthStrip.tsx components/dashboard/TodayActionStack.tsx components/dashboard/WalletRail.tsx
git commit -m "feat: redesign dashboard experience"
```

### Task 17: Intelligence Command Center

**Files:**
- Create: `app/(main)/intelligence/page.tsx`
- Modify: `app/(main)/advisor/page.tsx`
- Reuse: `components/intelligence/AutopilotFeed.tsx`
- Reuse: `components/intelligence/WhatIfSimulator.tsx`
- Reuse: `components/intelligence/AIReviewCard.tsx`
- Reuse: `components/intelligence/GoalPlannerSheet.tsx`

- [ ] **Step 1: Build command center page**

Sections:
- Autopilot feed,
- ask AI,
- what-if simulator,
- AI budget coach,
- weekly/monthly review,
- privacy controls.

- [ ] **Step 2: Refactor advisor**

Keep chat, but enrich with action cards:
- “buat budget plan”,
- “cek cash-flow 30 hari”,
- “simulasi cicilan”,
- “review bulan ini”.

- [ ] **Step 3: Add AI transparency**

Show “berdasarkan data yang kamu catat” and allow clearing AI history/reports.

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`

- [ ] **Step 5: Commit**

Run:
```bash
git add "app/(main)/intelligence/page.tsx" "app/(main)/advisor/page.tsx"
git commit -m "feat: add AI intelligence command center"
```

### Task 18: Transaction Experience Redesign

**Files:**
- Modify: `app/(main)/transactions/page.tsx`
- Modify: `components/transactions/AddTransactionSheet.tsx`
- Modify: `components/transactions/TransactionDetailSheet.tsx`
- Create: `components/transactions/TransactionSearchBar.tsx`
- Create: `components/transactions/TransactionFilterSheet.tsx`
- Create: `components/transactions/TransactionListItem.tsx`

- [ ] **Step 1: Extract list item component**

Move transaction row rendering into `TransactionListItem`.

- [ ] **Step 2: Add search and filters**

Support:
- merchant/note,
- category,
- wallet,
- source type,
- anomaly only,
- date range.

- [ ] **Step 3: Improve add transaction flow**

Flow:
- amount keypad first,
- AI category suggestion,
- wallet/category chips,
- optional details,
- photo/voice shortcuts,
- review before save for AI extracted data.

- [ ] **Step 4: Add undo delete**

Use toast with undo for destructive actions.

- [ ] **Step 5: Run build**

Run: `npm.cmd run build`

- [ ] **Step 6: Commit**

Run:
```bash
git add "app/(main)/transactions/page.tsx" components/transactions/AddTransactionSheet.tsx components/transactions/TransactionDetailSheet.tsx components/transactions/TransactionSearchBar.tsx components/transactions/TransactionFilterSheet.tsx components/transactions/TransactionListItem.tsx
git commit -m "feat: redesign transaction experience"
```

### Task 19: Analytics Page

**Files:**
- Create: `app/(main)/analytics/page.tsx`
- Create: `components/analytics/SpendingTrendPanel.tsx`
- Create: `components/analytics/CategoryDeepDive.tsx`
- Create: `components/analytics/SubscriptionPanel.tsx`
- Create: `components/analytics/HealthBreakdownPanel.tsx`
- Create: `components/charts/CategoryTrendChart.tsx`

- [ ] **Step 1: Build analytics route**

This should be data-dense but mobile-friendly. Avoid marketing-style hero sections.

- [ ] **Step 2: Add period controls**

Use segmented controls for:
- minggu,
- bulan,
- 3 bulan,
- custom.

- [ ] **Step 3: Add chart accessibility**

Each chart must include an `aria-label` and visible text summary.

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`

- [ ] **Step 5: Commit**

Run:
```bash
git add "app/(main)/analytics/page.tsx" components/analytics/SpendingTrendPanel.tsx components/analytics/CategoryDeepDive.tsx components/analytics/SubscriptionPanel.tsx components/analytics/HealthBreakdownPanel.tsx components/charts/CategoryTrendChart.tsx
git commit -m "feat: add advanced analytics page"
```

### Task 20: Accessibility, Motion, And Mobile QA Pass

**Files:**
- Modify: all changed UI files as needed.
- Modify: `Design.md`
- Modify: `PRD.md`

- [ ] **Step 1: Run static checks**

Run:
```bash
npm.cmd run build
npm.cmd run test
```

- [ ] **Step 2: Manual UI checklist**

Verify:
- 375px mobile viewport has no horizontal scroll.
- landscape viewport remains usable.
- all touch targets are at least 44px.
- all icon-only buttons have labels.
- focus-visible states are visible.
- reduced motion does not break navigation.
- dark mode text contrast remains readable.
- privacy mode hides/scrambles sensitive amounts.

- [ ] **Step 3: Update docs**

Update:
- `PRD.md` with new AI feature requirements.
- `Design.md` with new IA, tokens, primitives, and UI rules.

- [ ] **Step 4: Final verification**

Run:
```bash
npm.cmd run build
npm.cmd run test
```

- [ ] **Step 5: Commit**

Run:
```bash
git add PRD.md Design.md app components lib
git commit -m "docs: document AI premium and UI overhaul"
```

---

## Implementation Rules

- Read relevant Next.js 16 docs in `node_modules/next/dist/docs/` before changing route handlers, server/client component boundaries, CSS, images, or metadata.
- Keep all financial math in pure functions and test it with Vitest before UI integration.
- Keep AI outputs reviewable. AI may suggest, summarize, and plan, but must not silently mutate user finance data.
- Keep AI payloads privacy-minimized. Never send raw full transaction history unless a specific feature truly needs it and the user explicitly initiates it.
- Maintain local-first behavior. AI features can fail gracefully while manual finance tracking still works offline.
- Avoid hardcoded text colors. Use semantic tokens from `app/globals.css`.
- Avoid emoji as structural icons. Use Phosphor icons for navigation, buttons, and system actions.
- Preserve 44px minimum tap targets and safe-area padding.
- Use Framer Motion for meaningful state transitions only, with reduced-motion support.

---

## Suggested Delivery Milestones

### Milestone 1: Reliable Intelligence Core

Complete Tasks 1-4.

User-visible result: dashboard can show cash-flow forecast powered by tested deterministic logic.

### Milestone 2: Proactive AI

Complete Tasks 5-8.

User-visible result: app warns, suggests, categorizes, and detects subscriptions proactively.

### Milestone 3: Premium AI Suite

Complete Tasks 9-13.

User-visible result: health score, AI goal planning, what-if simulation, anomaly detection, and review reports.

### Milestone 4: Total UI/UX Overhaul

Complete Tasks 14-20.

User-visible result: app feels like a polished iOS-first AI finance app, not a form-heavy tracker.

---

## Final Verification Gate

Before claiming the whole program is complete:

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] AI routes return graceful errors when env key is missing.
- [ ] Manual transaction entry works offline.
- [ ] AI-suggested budget/category/goal changes require explicit user confirmation.
- [ ] No sensitive raw finance data is logged to console.
- [ ] No hardcoded `text-white` or `text-black` remains in reusable UI except audited on-accent cases.
- [ ] Mobile dashboard, transactions, intelligence, and analytics are checked at 375px width.
- [ ] Dark mode, reduced motion, and privacy mode are manually verified.
