// ============================================
// Pundi — Cash Flow Projection Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { buildCashFlowProjection, type CashFlowInput } from './cash-flow';

function makeCashFlowInput(overrides?: Partial<CashFlowInput>): CashFlowInput {
  return {
    wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
    transactions: [],
    recurringTransactions: [],
    debts: [],
    budgets: [],
    todayDate: '2026-07-01',
    projectionDays: 30,
    includeDailyBudgetBurn: false,
    ...overrides,
  };
}

describe('buildCashFlowProjection', () => {
  it('starts with current wallet balance', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [
        { id: 'w1', name: 'Cash', balance: 2_000_000, type: 'cash' },
        { id: 'w2', name: 'Bank', balance: 3_000_000, type: 'bank' },
      ],
    }));
    expect(proj.currentBalance).toBe(5_000_000);
    expect(proj.projectedBalance).toBe(5_000_000);
    expect(proj.lowestProjectedBalance).toBe(5_000_000);
    expect(proj.series[0].balance).toBe(5_000_000);
  });

  it('adds scheduled income', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
      recurringTransactions: [
        { id: 'r1', name: 'Gaji', amount: 10_000_000, type: 'income', next_due_date: '2026-07-25', status: 'active', category_id: 'c1', wallet_id: 'w1', frequency: 'monthly' },
      ],
    }));
    expect(proj.currentBalance).toBe(5_000_000);
    expect(proj.projectedBalance).toBe(15_000_000);
    
    const event = proj.events.find(e => e.label === 'Gaji');
    expect(event).toBeDefined();
    expect(event?.amount).toBe(10_000_000);
    expect(event?.date).toBe('2026-07-25');
  });

  it('subtracts scheduled expense', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
      recurringTransactions: [
        { id: 'r1', name: 'Kos', amount: 2_000_000, type: 'expense', next_due_date: '2026-07-05', status: 'active', category_id: 'c1', wallet_id: 'w1', frequency: 'monthly' },
      ],
    }));
    expect(proj.projectedBalance).toBe(3_000_000);
    expect(proj.lowestProjectedBalance).toBe(3_000_000);
  });

  it('ignores inactive recurring items', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
      recurringTransactions: [
        { id: 'r1', name: 'Kos', amount: 2_000_000, type: 'expense', next_due_date: '2026-07-05', status: 'paused', category_id: 'c1', wallet_id: 'w1', frequency: 'monthly' },
      ],
    }));
    expect(proj.projectedBalance).toBe(5_000_000);
  });

  it('subtracts credit card due amount', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [
        { id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' },
        { id: 'cc1', name: 'CC', balance: 0, type: 'credit_card', credit_outstanding: 1_500_000, credit_due_date: '2026-07-15' },
      ],
    }));
    expect(proj.projectedBalance).toBe(3_500_000);
    
    const event = proj.events.find(e => e.type === 'credit_card_due');
    expect(event).toBeDefined();
    expect(event?.amount).toBe(1_500_000);
  });

  it('subtracts upcoming debt payments', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
      debts: [
        { id: 'd1', creditor: 'Andi', remaining: 1_000_000, total: 1_000_000, status: 'active', due_date: '2026-07-10' },
      ],
    }));
    expect(proj.projectedBalance).toBe(4_000_000);
  });

  it('handles multiple occurrences of daily/weekly recurring within period', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      todayDate: '2026-07-01',
      projectionDays: 14,
      wallets: [{ id: 'w1', name: 'Cash', balance: 5_000_000, type: 'cash' }],
      recurringTransactions: [
        { id: 'r1', name: 'Kopi Mingguan', amount: 100_000, type: 'expense', next_due_date: '2026-07-03', status: 'active', category_id: 'c1', wallet_id: 'w1', frequency: 'weekly' },
      ],
    }));
    // Will occur on July 3 and July 10
    expect(proj.projectedBalance).toBe(4_800_000);
    expect(proj.events.filter(e => e.label === 'Kopi Mingguan')).toHaveLength(2);
  });

  it('applies daily budget burn if requested', () => {
    const proj = buildCashFlowProjection(makeCashFlowInput({
      todayDate: '2026-07-01',
      projectionDays: 30,
      includeDailyBudgetBurn: true,
      wallets: [{ id: 'w1', name: 'Cash', balance: 10_000_000, type: 'cash' }],
      budgets: [
        { categoryId: 'c1', amount: 3_100_000 } // approx 100k / day for July
      ],
    }));
    // Will subtract ~100k per day for 30 days
    expect(proj.projectedBalance).toBeLessThan(10_000_000);
    expect(proj.projectedBalance).toBeGreaterThan(6_000_000);
  });

  it('calculates risk level correctly', () => {
    // Danger: drops below 0
    const danger = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 1_000_000, type: 'cash' }],
      debts: [{ id: 'd1', creditor: 'Andi', remaining: 2_000_000, total: 2_000_000, status: 'active', due_date: '2026-07-10' }],
    }));
    expect(danger.riskLevel).toBe('danger');

    // Caution: drops below 20% of start
    const caution = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 10_000_000, type: 'cash' }],
      debts: [{ id: 'd1', creditor: 'Andi', remaining: 8_500_000, total: 8_500_000, status: 'active', due_date: '2026-07-10' }],
    }));
    expect(caution.riskLevel).toBe('caution');

    // Safe
    const safe = buildCashFlowProjection(makeCashFlowInput({
      wallets: [{ id: 'w1', name: 'Cash', balance: 10_000_000, type: 'cash' }],
    }));
    expect(safe.riskLevel).toBe('safe');
  });
});
