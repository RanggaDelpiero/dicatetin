// ============================================
// Pundi — Finance Period Helpers
// ============================================
// Reusable date range helpers for day/week/month/custom periods.
// All date keys use 'YYYY-MM-DD' format for timezone-safe date-only comparisons.

/**
 * Convert a Date or ISO string to a date-only key (YYYY-MM-DD).
 * Uses local date parts to avoid timezone-shifting issues.
 */
export function toDateKey(date: Date | string): string {
  if (typeof date === 'string') {
    // If it's already a date-only string, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Strip time component from ISO strings
    return date.split('T')[0];
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the start and end of the month containing `date`.
 * Uses actual calendar days (not assumed 30).
 */
export function getMonthPeriod(date: Date): { start: string; end: string; days: number } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0); // day 0 of next month = last day of this month
  const days = lastDay.getDate();
  return {
    start: toDateKey(firstDay),
    end: toDateKey(lastDay),
    days,
  };
}

/**
 * Get the Monday–Sunday week period containing `date`.
 * Week starts on Monday (standard for Indonesian usage).
 */
export function getWeekPeriod(date: Date): { start: string; end: string } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Distance from Monday: if Sunday (0) → 6, else day - 1
  const distFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - distFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toDateKey(monday),
    end: toDateKey(sunday),
  };
}

/**
 * Get an inclusive array of date keys between `start` and `end`.
 */
export function getDaysBetween(start: string, end: string): string[] {
  assertValidPeriod(start, end);
  const days: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (current <= endDate) {
    days.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Assert that `start` and `end` form a valid period (end >= start).
 * Throws if inputs are invalid or end is before start.
 */
export function assertValidPeriod(start: string, end: string): void {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(start) || !datePattern.test(end)) {
    throw new Error(`Invalid date format. Expected YYYY-MM-DD, got start="${start}" end="${end}"`);
  }
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    throw new Error(`Invalid date value. start="${start}" end="${end}"`);
  }
  if (e < s) {
    throw new Error(`Period end "${end}" is before start "${start}"`);
  }
}
