// ============================================
// Pundi — Recurring Transaction Detector Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { detectRecurringTransactions, type TransactionInput } from './recurring-detector';

function makeTx(id: string, note: string, amount: number, date: string): TransactionInput {
  return { id, note, amount, date, type: 'expense' };
}

describe('detectRecurringTransactions', () => {
  it('detects a monthly recurring transaction based on exact amount and similar note', () => {
    const transactions = [
      makeTx('1', 'Netflix', 169000, '2026-05-01T10:00:00Z'),
      makeTx('2', 'Netflix Premium', 169000, '2026-06-01T10:00:00Z'),
      makeTx('3', 'Netflix', 169000, '2026-07-02T10:00:00Z'), // ~30 days
      makeTx('4', 'Kopi', 50000, '2026-07-03T10:00:00Z'), // Noise
      makeTx('5', 'Listrik', 500000, '2026-07-05T10:00:00Z'), // Noise
    ];

    const detected = detectRecurringTransactions(transactions);
    
    expect(detected).toHaveLength(1);
    expect(detected[0].name.toLowerCase()).toContain('netflix');
    expect(detected[0].amount).toBe(169000);
    expect(detected[0].frequency).toBe('monthly');
    expect(detected[0].confidence).toBeGreaterThan(0.8);
    // Next due should be approx 2026-08-01 / 2026-08-02
    expect(detected[0].nextDueDate.startsWith('2026-08-0')).toBe(true);
  });

  it('detects a weekly recurring transaction', () => {
    const transactions = [
      makeTx('1', 'Laundry', 40000, '2026-07-01T10:00:00Z'),
      makeTx('2', 'Laundry Baju', 40000, '2026-07-08T10:00:00Z'),
      makeTx('3', 'Laundry', 40000, '2026-07-15T10:00:00Z'),
    ];

    const detected = detectRecurringTransactions(transactions);
    
    expect(detected).toHaveLength(1);
    expect(detected[0].name.toLowerCase()).toContain('laundry');
    expect(detected[0].amount).toBe(40000);
    expect(detected[0].frequency).toBe('weekly');
  });

  it('ignores transactions with fewer than 3 occurrences', () => {
    const transactions = [
      makeTx('1', 'Spotify', 54900, '2026-06-01T10:00:00Z'),
      makeTx('2', 'Spotify', 54900, '2026-07-01T10:00:00Z'),
    ];

    const detected = detectRecurringTransactions(transactions);
    expect(detected).toHaveLength(0);
  });

  it('does not cluster transactions with different amounts', () => {
    const transactions = [
      makeTx('1', 'Listrik', 250000, '2026-05-01T10:00:00Z'),
      makeTx('2', 'Listrik', 310000, '2026-06-01T10:00:00Z'),
      makeTx('3', 'Listrik', 280000, '2026-07-01T10:00:00Z'),
    ];

    // Amounts differ significantly, should not be detected as strict fixed recurring yet
    const detected = detectRecurringTransactions(transactions);
    expect(detected).toHaveLength(0);
  });

  it('handles variations in note strings (case insensitivity and partial matches)', () => {
    const transactions = [
      makeTx('1', 'Tagihan Internet MyRepublic', 350000, '2026-05-15T10:00:00Z'),
      makeTx('2', 'MYREPUBLIC INTERNET', 350000, '2026-06-15T10:00:00Z'),
      makeTx('3', 'My republic bulan Juli', 350000, '2026-07-16T10:00:00Z'),
    ];

    const detected = detectRecurringTransactions(transactions);
    expect(detected).toHaveLength(1);
    expect(detected[0].frequency).toBe('monthly');
  });
});
