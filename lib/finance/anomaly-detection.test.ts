// ============================================
// Pundi — Anomaly Detection Tests
// ============================================

import { describe, expect, it } from 'vitest';
import { detectAnomalies, type TransactionInput } from './anomaly-detection';

function makeTx(id: string, category_id: string, amount: number, date: string): TransactionInput {
  return { id, category_id, amount, date, type: 'expense' };
}

describe('detectAnomalies', () => {
  it('detects a transaction that is significantly higher than historical average for its category', () => {
    const historical = [
      makeTx('1', 'food', 50000, '2026-04-01T10:00:00Z'),
      makeTx('2', 'food', 55000, '2026-05-01T10:00:00Z'),
      makeTx('3', 'food', 45000, '2026-06-01T10:00:00Z'),
      makeTx('4', 'food', 60000, '2026-06-15T10:00:00Z'),
    ];
    
    // Average is ~52.5k, std dev is small. 
    // 300k is an anomaly.
    const current = [
      makeTx('10', 'food', 300000, '2026-07-01T10:00:00Z'),
      makeTx('11', 'food', 50000, '2026-07-02T10:00:00Z'), // Normal
    ];

    const anomalies = detectAnomalies(current, historical);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].transactionId).toBe('10');
    expect(anomalies[0].type).toBe('high_expense');
    expect(anomalies[0].expectedAmount).toBeCloseTo(52500, -2);
  });

  it('ignores large transactions if there is no historical data', () => {
    const current = [
      makeTx('10', 'travel', 2000000, '2026-07-01T10:00:00Z'),
    ];

    const anomalies = detectAnomalies(current, []);
    expect(anomalies).toHaveLength(0); // Cannot know if it's an anomaly without history
  });

  it('does not flag normal variations', () => {
    const historical = [
      makeTx('1', 'food', 50000, '2026-04-01T10:00:00Z'),
      makeTx('2', 'food', 55000, '2026-05-01T10:00:00Z'),
      makeTx('3', 'food', 45000, '2026-06-01T10:00:00Z'),
    ];
    
    // 70k is a bit higher but within normal bounds if threshold is high enough
    const current = [
      makeTx('10', 'food', 70000, '2026-07-01T10:00:00Z'),
    ];

    const anomalies = detectAnomalies(current, historical);
    expect(anomalies).toHaveLength(0);
  });

  it('handles empty inputs', () => {
    const anomalies = detectAnomalies([], []);
    expect(anomalies).toHaveLength(0);
  });
});
