// ============================================
// Pundi — Financial Health Score Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { calculateFinancialHealth, type HealthInput } from './financial-health';

function makeInput(overrides?: Partial<HealthInput>): HealthInput {
  return {
    totalIncome: 10_000_000,
    totalExpense: 8_000_000,
    totalSavings: 15_000_000, // liquid balance
    totalDebt: 5_000_000,
    monthlyDebtPayment: 1_000_000,
    needsExpense: 5_000_000, // 50%
    wantsExpense: 2_000_000, // 20%
    savingsExpense: 1_000_000, // 10%
    ...overrides,
  };
}

describe('calculateFinancialHealth', () => {
  it('calculates a perfect score for ideal finances', () => {
    const health = calculateFinancialHealth(makeInput({
      totalIncome: 10_000_000,
      totalExpense: 7_000_000,
      totalSavings: 60_000_000, // 6 months of income
      totalDebt: 0,
      monthlyDebtPayment: 0,
      needsExpense: 4_500_000, // 45%
      wantsExpense: 2_500_000, // 25%
      savingsExpense: 3_000_000, // 30% saving rate
    }));

    expect(health.score).toBeGreaterThan(90);
    expect(health.grade).toBe('A');
  });

  it('deducts points for high debt-to-income ratio', () => {
    const health = calculateFinancialHealth(makeInput({
      monthlyDebtPayment: 4_500_000, // 45% of 10M income (danger)
    }));

    expect(health.score).toBeLessThan(70);
    const dtiMetric = health.metrics.find(m => m.id === 'dti');
    expect(dtiMetric?.status).toBe('danger');
  });

  it('deducts points for low emergency fund', () => {
    const health = calculateFinancialHealth(makeInput({
      totalSavings: 2_000_000, // very low compared to 8M expense
    }));

    const efMetric = health.metrics.find(m => m.id === 'emergency_fund');
    expect(efMetric?.status).toBe('danger');
  });

  it('evaluates the 50/30/20 rule', () => {
    const health = calculateFinancialHealth(makeInput({
      totalExpense: 10_000_000, // 0 savings
      needsExpense: 7_000_000, // 70% needs (too high)
      wantsExpense: 3_000_000, // 30%
      savingsExpense: 0, // 0% savings
    }));

    const budgetMetric = health.metrics.find(m => m.id === 'budget_rule');
    expect(budgetMetric?.status).toBe('danger');
    expect(health.score).toBeLessThan(60);
  });

  it('provides actionable top improvement', () => {
    const health = calculateFinancialHealth(makeInput({
      totalSavings: 0,
    }));
    
    expect(health.topImprovement).toBeDefined();
    // Usually emergency fund takes priority if it's 0
  });

  it('handles zero income safely', () => {
    const health = calculateFinancialHealth(makeInput({
      totalIncome: 0,
      totalExpense: 1_000_000,
    }));

    expect(health.score).toBeLessThan(40);
    expect(health.grade).toBe('F');
  });
});
