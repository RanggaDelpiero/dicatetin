// ============================================
// Pundi — AI Payload Sanitizer
// ============================================
// Strips raw sensitive fields from AI payloads.
// Only sends aggregated/summary data — never raw transaction dumps,
// receipt URLs, user IDs, or API keys.

// ---- Input types (from app state) ----

export interface SanitizeTransactionSummary {
  id: string;
  note?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  categoryName: string;
  date: string;
  receipt_url?: string;
}

export interface SanitizeInput {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  categoryBreakdown: { name: string; amount: number; percentage: number }[];
  transactions: SanitizeTransactionSummary[];
  wallets: { name: string; type: string; balance: number }[];
  recurringItems: { name: string; amount: number; frequency: string; nextDue: string }[];
  debts: { creditor: string; remaining: number; total: number; dueDate?: string }[];
  goals: { name: string; target: number; current: number }[];
  // Optional extended context
  cashFlowForecast?: { riskLevel: string; lowestBalance: number; lowestDate: string };
  healthScore?: { score: number; grade: string };
  anomalySummary?: { count: number; topAnomaly?: string };
}

// ---- Output types (safe for AI) ----

export interface SanitizedAIPayload {
  periodSummary: {
    start: string;
    end: string;
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    netFlow: number;
    savingRate: number;
  };
  categoryBreakdown: { name: string; amount: number; percentage: number }[];
  transactionCounts: {
    income: number;
    expense: number;
    transfer: number;
    total: number;
  };
  wallets: { name: string; type: string; balance: number }[];
  recurringSummary: { name: string; amount: number; frequency: string; nextDue: string }[];
  debtPressure: { creditor: string; remaining: number; total: number; paidPercentage: number; dueDate?: string }[];
  goalProgress: { name: string; target: number; current: number; percentage: number }[];
  // Optional extended sections
  cashFlowForecast?: { riskLevel: string; lowestBalance: number; lowestDate: string };
  healthScore?: { score: number; grade: string };
  anomalySummary?: { count: number; topAnomaly?: string };
}

/**
 * Build a privacy-safe AI payload from aggregate app state.
 * Never includes raw transaction notes, receipt URLs, user IDs, or API keys.
 */
export function buildSanitizedAIPayload(input: SanitizeInput): SanitizedAIPayload {
  const netFlow = input.totalIncome - input.totalExpense;
  const savingRate = input.totalIncome > 0
    ? Math.round((netFlow / input.totalIncome) * 100 * 100) / 100
    : 0;

  // Count transactions by type without exposing raw data
  const transactionCounts = {
    income: 0,
    expense: 0,
    transfer: 0,
    total: input.transactions.length,
  };
  for (const tx of input.transactions) {
    if (tx.type === 'income') transactionCounts.income++;
    else if (tx.type === 'expense') transactionCounts.expense++;
    else if (tx.type === 'transfer') transactionCounts.transfer++;
  }

  const payload: SanitizedAIPayload = {
    periodSummary: {
      start: input.periodStart,
      end: input.periodEnd,
      totalIncome: input.totalIncome,
      totalExpense: input.totalExpense,
      totalBalance: input.totalBalance,
      netFlow,
      savingRate,
    },
    categoryBreakdown: input.categoryBreakdown.map(c => ({
      name: c.name,
      amount: c.amount,
      percentage: c.percentage,
    })),
    transactionCounts,
    wallets: input.wallets.map(w => ({
      name: w.name,
      type: w.type,
      balance: w.balance,
    })),
    recurringSummary: input.recurringItems.map(r => ({
      name: r.name,
      amount: r.amount,
      frequency: r.frequency,
      nextDue: r.nextDue,
    })),
    debtPressure: input.debts.map(d => ({
      creditor: d.creditor,
      remaining: d.remaining,
      total: d.total,
      paidPercentage: d.total > 0 ? Math.round(((d.total - d.remaining) / d.total) * 100) : 0,
      ...(d.dueDate ? { dueDate: d.dueDate } : {}),
    })),
    goalProgress: input.goals.map(g => ({
      name: g.name,
      target: g.target,
      current: g.current,
      percentage: g.target > 0 ? Math.round((g.current / g.target) * 100) : 0,
    })),
  };

  // Attach optional extended context if available
  if (input.cashFlowForecast) {
    payload.cashFlowForecast = { ...input.cashFlowForecast };
  }
  if (input.healthScore) {
    payload.healthScore = { ...input.healthScore };
  }
  if (input.anomalySummary) {
    payload.anomalySummary = { ...input.anomalySummary };
  }

  return payload;
}
