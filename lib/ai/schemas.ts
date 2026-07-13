// ============================================
// Pundi — AI Schema Types
// ============================================
// Strict request/response TypeScript types for AI planner/report outputs.

// ---- Insight Kinds & Severity ----

export type AIInsightKind =
  | 'overspending'
  | 'cash_flow_risk'
  | 'category_spike'
  | 'upcoming_due'
  | 'recurring_charge'
  | 'achievement'
  | 'budget_suggestion'
  | 'anomaly'
  | 'saving_opportunity'
  | 'debt_pressure'
  | 'general';

export type AIInsightSeverity = 'info' | 'success' | 'warning' | 'critical';

// ---- AI Insight ----

export interface AIInsight {
  id: string;
  kind: AIInsightKind;
  severity: AIInsightSeverity;
  title: string;
  explanation: string;
  suggestedAction?: AIActionSuggestion;
  destinationLink?: string;
  dataSignature: string; // hash to detect if data changed since insight was generated
  createdAt: string;
  dismissedAt?: string;
  acceptedAt?: string;
}

// ---- Financial Alert ----

export interface FinancialAlert {
  id: string;
  type: 'cash_flow_warning' | 'budget_exceeded' | 'due_date_near' | 'anomaly_detected' | 'negative_balance';
  title: string;
  message: string;
  severity: AIInsightSeverity;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
}

// ---- Action Suggestion ----

export interface AIActionSuggestion {
  label: string;
  actionType: 'navigate' | 'apply_budget' | 'dismiss' | 'mark_done' | 'review';
  payload?: Record<string, unknown>;
}

// ---- Cash Flow Projection ----

export interface CashFlowProjectionEvent {
  date: string;
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'debt_payment' | 'credit_card_due';
  sourceId?: string;
}

export interface CashFlowProjection {
  currentBalance: number;
  projectedBalance: number;
  lowestProjectedBalance: number;
  lowestProjectedDate: string;
  riskLevel: 'safe' | 'caution' | 'danger';
  events: CashFlowProjectionEvent[];
  series: { date: string; balance: number }[];
}

// ---- Detected Recurring ----

export interface DetectedRecurring {
  id: string;
  merchantKey: string;
  merchantName: string;
  amountMin: number;
  amountMax: number;
  cadence: 'weekly' | 'monthly' | 'yearly';
  nextExpectedDate: string;
  confidence: number; // 0-1
  matchedTransactionIds: string[];
  dismissed: boolean;
  linkedRecurringId?: string; // if user linked to existing recurring entry
}

// ---- Financial Goal Plan ----

export interface FinancialGoalPlanOption {
  mode: 'relaxed' | 'balanced' | 'aggressive';
  dailySaving: number;
  weeklySaving: number;
  monthlySaving: number;
  estimatedCompletionDate: string;
  recommendedSourceCategories: string[];
  milestones: { percentage: number; date: string; label: string }[];
  riskMessage?: string;
}

export interface FinancialGoalPlan {
  goalId: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  options: FinancialGoalPlanOption[];
  generatedAt: string;
}

// ---- What-If Scenario ----

export type WhatIfScenarioType =
  | 'reduce_category'
  | 'add_recurring_expense'
  | 'add_debt_payment'
  | 'increase_income'
  | 'remove_subscription';

export interface WhatIfScenario {
  id: string;
  type: WhatIfScenarioType;
  label: string;
  params: Record<string, number | string>;
  result: {
    monthlySavingsDelta: number;
    projectedSavingsIn3Months: number;
    projectedSavingsIn6Months: number;
    cashFlowRiskChange: 'improved' | 'unchanged' | 'worsened';
    explanation: string;
  };
}

// ---- AI Response Schemas ----

export interface AIReviewResponse {
  headline: string;
  wins: string[];
  risks: string[];
  topCategoryMovement: {
    category: string;
    direction: 'up' | 'down';
    percentageChange: number;
  } | null;
  recommendedAction: string;
  nextTarget: string;
}

export interface BudgetCoachResponse {
  suggestions: {
    categoryId: string;
    categoryName: string;
    suggestedAmount: number;
    currentSpending: number;
    reasoning: string;
    confidence: number;
  }[];
  strictnessMode: 'hemat' | 'normal' | 'agresif_nabung';
  totalBudget: number;
  monthlyIncome: number;
  warningIfExceedsIncome?: string;
}

export interface GoalPlanResponse {
  plans: FinancialGoalPlanOption[];
  summary: string;
}

export interface CategorizationResponse {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1
  reasoning: string;
  alternativeCategoryId?: string;
}

// ---- User Preferences ----

export type UITheme = 'light' | 'dark' | 'system';
export type UIDensity = 'compact' | 'comfortable';
export type AIProactivity = 'minimal' | 'normal' | 'proactive';

export interface UserPreferences {
  theme: UITheme;
  density: UIDensity;
  privacyMode: boolean;
  aiProactivity: AIProactivity;
  reducedMotion: boolean;
}
