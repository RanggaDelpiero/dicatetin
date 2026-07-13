// ============================================
// Pundi — Period Helpers Tests
// ============================================

import { describe, expect, it } from 'vitest';
import {
  toDateKey,
  getMonthPeriod,
  getWeekPeriod,
  getDaysBetween,
  assertValidPeriod,
} from './periods';

describe('toDateKey', () => {
  it('converts Date to YYYY-MM-DD string', () => {
    const date = new Date(2026, 6, 13); // July 13, 2026
    expect(toDateKey(date)).toBe('2026-07-13');
  });

  it('returns string dates unchanged', () => {
    expect(toDateKey('2026-07-13')).toBe('2026-07-13');
  });

  it('strips time component from ISO string', () => {
    expect(toDateKey('2026-07-13T14:30:00.000Z')).toBe('2026-07-13');
  });
});

describe('getMonthPeriod', () => {
  it('returns correct start and end for July 2026', () => {
    const result = getMonthPeriod(new Date(2026, 6, 13));
    expect(result.start).toBe('2026-07-01');
    expect(result.end).toBe('2026-07-31');
    expect(result.days).toBe(31);
  });

  it('handles February in non-leap year (2025)', () => {
    const result = getMonthPeriod(new Date(2025, 1, 15));
    expect(result.start).toBe('2025-02-01');
    expect(result.end).toBe('2025-02-28');
    expect(result.days).toBe(28);
  });

  it('handles February in leap year (2028)', () => {
    const result = getMonthPeriod(new Date(2028, 1, 15));
    expect(result.start).toBe('2028-02-01');
    expect(result.end).toBe('2028-02-29');
    expect(result.days).toBe(29);
  });

  it('uses actual calendar days, not assumed 30', () => {
    const jan = getMonthPeriod(new Date(2026, 0, 1));
    expect(jan.days).toBe(31);
    const apr = getMonthPeriod(new Date(2026, 3, 1));
    expect(apr.days).toBe(30);
  });
});

describe('getWeekPeriod', () => {
  it('starts on Monday for a mid-week date', () => {
    // July 13, 2026 is Monday
    const result = getWeekPeriod(new Date(2026, 6, 15)); // Wednesday
    expect(result.start).toBe('2026-07-13');
    expect(result.end).toBe('2026-07-19');
  });

  it('starts on Monday when given a Sunday', () => {
    // July 19, 2026 is Sunday
    const result = getWeekPeriod(new Date(2026, 6, 19));
    expect(result.start).toBe('2026-07-13');
    expect(result.end).toBe('2026-07-19');
  });

  it('starts on Monday when given a Monday', () => {
    const result = getWeekPeriod(new Date(2026, 6, 13));
    expect(result.start).toBe('2026-07-13');
    expect(result.end).toBe('2026-07-19');
  });

  it('handles week crossing month boundary', () => {
    // July 31, 2026 is Friday
    const result = getWeekPeriod(new Date(2026, 6, 31));
    expect(result.start).toBe('2026-07-27');
    expect(result.end).toBe('2026-08-02');
  });
});

describe('getDaysBetween', () => {
  it('returns array of date keys for a range', () => {
    const days = getDaysBetween('2026-07-13', '2026-07-16');
    expect(days).toEqual(['2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16']);
  });

  it('returns single day when start equals end', () => {
    const days = getDaysBetween('2026-07-13', '2026-07-13');
    expect(days).toEqual(['2026-07-13']);
  });

  it('handles crossing month boundary', () => {
    const days = getDaysBetween('2026-07-30', '2026-08-02');
    expect(days).toEqual(['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']);
  });
});

describe('assertValidPeriod', () => {
  it('does not throw for valid period', () => {
    expect(() => assertValidPeriod('2026-07-01', '2026-07-31')).not.toThrow();
  });

  it('does not throw when start equals end', () => {
    expect(() => assertValidPeriod('2026-07-13', '2026-07-13')).not.toThrow();
  });

  it('throws when end is before start', () => {
    expect(() => assertValidPeriod('2026-07-31', '2026-07-01')).toThrow();
  });

  it('throws for invalid date format', () => {
    expect(() => assertValidPeriod('not-a-date', '2026-07-01')).toThrow();
  });
});
