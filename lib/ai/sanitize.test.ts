// ============================================
// Pundi — AI Payload Sanitizer Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { buildSanitizedAIPayload, type SanitizeInput } from './sanitize';

function makeSanitizeInput(overrides?: Partial<SanitizeInput>): SanitizeInput {
  return {
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    totalIncome: 5_000_000,
    totalExpense: 3_500_000,
    totalBalance: 10_000_000,
    categoryBreakdown: [
      { name: 'Makan & Minum', amount: 1_500_000, percentage: 43 },
      { name: 'Transport', amount: 800_000, percentage: 23 },
    ],
    transactions: [
      {
        id: 'tx1',
        note: 'Beli kopi di Starbucks Reserve Senayan City',
        amount: 75_000,
        type: 'expense' as const,
        categoryName: 'Kopi',
        date: '2026-07-10',
        receipt_url: 'https://example.com/receipt/abc123.jpg',
      },
      {
        id: 'tx2',
        note: 'Gaji bulan Juli',
        amount: 5_000_000,
        type: 'income' as const,
        categoryName: 'Gaji',
        date: '2026-07-01',
      },
    ],
    wallets: [
      { name: 'Cash', type: 'cash', balance: 500_000 },
      { name: 'BCA', type: 'bank', balance: 9_500_000 },
    ],
    recurringItems: [
      { name: 'Netflix', amount: 169_000, frequency: 'monthly', nextDue: '2026-08-01' },
    ],
    debts: [
      { creditor: 'Bank Mandiri', remaining: 5_000_000, total: 10_000_000, dueDate: '2026-12-01' },
    ],
    goals: [
      { name: 'Emergency Fund', target: 20_000_000, current: 8_000_000 },
    ],
    ...overrides,
  };
}

describe('buildSanitizedAIPayload', () => {
  it('includes period summary and totals', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.periodSummary).toBeDefined();
    expect(payload.periodSummary.start).toBe('2026-07-01');
    expect(payload.periodSummary.end).toBe('2026-07-31');
    expect(payload.periodSummary.totalIncome).toBe(5_000_000);
    expect(payload.periodSummary.totalExpense).toBe(3_500_000);
  });

  it('includes category breakdown', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.categoryBreakdown).toHaveLength(2);
    expect(payload.categoryBreakdown[0].name).toBe('Makan & Minum');
  });

  it('does NOT include raw transaction notes', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('Beli kopi di Starbucks Reserve Senayan City');
    expect(serialized).not.toContain('Gaji bulan Juli');
  });

  it('does NOT include receipt image URLs', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('receipt/abc123.jpg');
    expect(serialized).not.toContain('https://example.com');
  });

  it('never includes API keys or user IDs', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('user_id');
    expect(serialized).not.toContain('api_key');
    expect(serialized).not.toContain('apiKey');
  });

  it('retains wallet names', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.wallets).toHaveLength(2);
    expect(payload.wallets[0].name).toBe('Cash');
  });

  it('retains recurring summaries', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.recurringSummary).toHaveLength(1);
    expect(payload.recurringSummary[0].name).toBe('Netflix');
  });

  it('retains debt pressure summaries', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.debtPressure).toHaveLength(1);
    expect(payload.debtPressure[0].creditor).toBe('Bank Mandiri');
  });

  it('retains goal progress', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.goalProgress).toHaveLength(1);
    expect(payload.goalProgress[0].name).toBe('Emergency Fund');
    expect(payload.goalProgress[0].percentage).toBe(40);
  });

  it('computes trend deltas (income - expense)', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.periodSummary.netFlow).toBe(1_500_000);
    expect(payload.periodSummary.savingRate).toBeCloseTo(30);
  });

  it('includes transaction count summary without raw data', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput());
    expect(payload.transactionCounts).toBeDefined();
    expect(payload.transactionCounts.income).toBe(1);
    expect(payload.transactionCounts.expense).toBe(1);
  });

  it('handles empty inputs gracefully', () => {
    const payload = buildSanitizedAIPayload(makeSanitizeInput({
      transactions: [],
      recurringItems: [],
      debts: [],
      goals: [],
    }));
    expect(payload.transactionCounts.income).toBe(0);
    expect(payload.transactionCounts.expense).toBe(0);
    expect(payload.recurringSummary).toHaveLength(0);
    expect(payload.debtPressure).toHaveLength(0);
    expect(payload.goalProgress).toHaveLength(0);
  });
});
