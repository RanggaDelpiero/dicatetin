import { describe, expect, it } from 'vitest';
import {
  getAvailableCredit,
  getCreditUsagePercentage,
  getCreditCardPaymentStatus,
} from './credit-card';

describe('credit card helpers', () => {
  it('calculates available credit from limit and outstanding amount', () => {
    expect(getAvailableCredit(10_000_000, 3_250_000)).toBe(6_750_000);
  });

  it('never returns negative available credit', () => {
    expect(getAvailableCredit(1_000_000, 1_500_000)).toBe(0);
  });

  it('calculates usage percentage', () => {
    expect(getCreditUsagePercentage(10_000_000, 2_500_000)).toBe(25);
  });

  it('handles zero limit safely', () => {
    expect(getCreditUsagePercentage(0, 2_500_000)).toBe(0);
  });

  it('detects overdue payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-01', '2026-07-13')).toBe('overdue');
  });

  it('detects due soon payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-15', '2026-07-13')).toBe('due-soon');
  });

  it('detects safe payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-30', '2026-07-13')).toBe('safe');
  });
});
