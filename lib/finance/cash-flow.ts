// ============================================
// Pundi — Cash Flow Projection
// ============================================

import { CashFlowProjection, CashFlowProjectionEvent } from '@/lib/ai/schemas';

export interface CashFlowInput {
  wallets: { id: string; name: string; balance: number; type: string; credit_outstanding?: number; credit_due_date?: string }[];
  transactions: { id: string; amount: number; type: string; date: string }[];
  recurringTransactions: {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    next_due_date: string;
    status: string;
    category_id: string;
    wallet_id: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }[];
  debts: { id: string; creditor: string; remaining: number; total: number; status: string; due_date?: string }[];
  budgets: { categoryId: string; amount: number }[];
  todayDate: string; // YYYY-MM-DD
  projectionDays: number;
  includeDailyBudgetBurn: boolean;
}

export function buildCashFlowProjection(input: CashFlowInput): CashFlowProjection {
  const currentBalance = input.wallets.reduce((sum, w) => {
    // Only count liquid asset wallets for total balance (not credit cards which represent debt)
    if (w.type === 'credit_card') return sum;
    return sum + w.balance;
  }, 0);

  let runningBalance = currentBalance;
  let lowestBalance = currentBalance;
  let lowestDate = input.todayDate;
  
  const events: CashFlowProjectionEvent[] = [];
  const series: { date: string; balance: number }[] = [];

  const start = new Date(`${input.todayDate}T00:00:00`);
  
  // Calculate daily budget burn if requested
  let dailyBurn = 0;
  if (input.includeDailyBudgetBurn) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const totalBudget = input.budgets.reduce((sum, b) => sum + b.amount, 0);
    dailyBurn = Math.round(totalBudget / daysInMonth);
  }

  for (let i = 0; i <= input.projectionDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateKey = current.toISOString().split('T')[0];
    
    let dailyDelta = 0;

    // Daily budget burn
    if (input.includeDailyBudgetBurn && i > 0) {
      dailyDelta -= dailyBurn;
    }

    // Process recurring transactions
    for (const recurring of input.recurringTransactions) {
      if (recurring.status !== 'active') continue;
      
      const recurringStart = new Date(`${recurring.next_due_date}T00:00:00`);
      
      let isOccurringToday = false;
      
      // If it's the exact next due date, or if we need to project future occurrences based on frequency
      if (recurring.next_due_date === dateKey) {
        isOccurringToday = true;
      } else if (recurringStart < current) {
        // Need to calculate if it falls on this day based on frequency
        if (recurring.frequency === 'daily') {
          isOccurringToday = true;
        } else if (recurring.frequency === 'weekly') {
          const diffTime = current.getTime() - recurringStart.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          isOccurringToday = diffDays % 7 === 0;
        } else if (recurring.frequency === 'monthly') {
          isOccurringToday = current.getDate() === recurringStart.getDate();
        } else if (recurring.frequency === 'yearly') {
          isOccurringToday = current.getDate() === recurringStart.getDate() && current.getMonth() === recurringStart.getMonth();
        }
      }
      
      if (isOccurringToday) {
        const amount = recurring.type === 'income' ? recurring.amount : -recurring.amount;
        dailyDelta += amount;
        events.push({
          date: dateKey,
          label: recurring.name,
          amount: recurring.amount,
          type: recurring.type,
          sourceId: recurring.id
        });
      }
    }

    // Process credit card due dates
    for (const wallet of input.wallets) {
      if (wallet.type === 'credit_card' && wallet.credit_outstanding && wallet.credit_due_date === dateKey) {
        dailyDelta -= wallet.credit_outstanding;
        events.push({
          date: dateKey,
          label: `Tagihan CC ${wallet.name}`,
          amount: wallet.credit_outstanding,
          type: 'credit_card_due',
          sourceId: wallet.id
        });
      }
    }

    // Process upcoming debts
    for (const debt of input.debts) {
      if (debt.status === 'active' && debt.due_date === dateKey && debt.remaining > 0) {
        dailyDelta -= debt.remaining;
        events.push({
          date: dateKey,
          label: `Bayar Hutang ${debt.creditor}`,
          amount: debt.remaining,
          type: 'debt_payment',
          sourceId: debt.id
        });
      }
    }

    runningBalance += dailyDelta;

    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance;
      lowestDate = dateKey;
    }

    series.push({
      date: dateKey,
      balance: runningBalance
    });
  }

  // Determine risk level
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';
  if (lowestBalance < 0) {
    riskLevel = 'danger';
  } else if (lowestBalance < currentBalance * 0.2) {
    // Caution if projected to drop below 20% of current balance
    riskLevel = 'caution';
  }

  return {
    currentBalance,
    projectedBalance: runningBalance,
    lowestProjectedBalance: lowestBalance,
    lowestProjectedDate: lowestDate,
    riskLevel,
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
    series
  };
}
