// ============================================
// Pundi — Currency & Number Utilities
// ============================================

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * Format integer Rupiah amount to display string
 * e.g., 1500000 → "Rp1.500.000"
 */
export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

/**
 * Format with compact notation for large numbers
 * e.g., 1500000 → "Rp1,5 jt"
 */
export function formatCurrencyCompact(amount: number): string {
  return compactFormatter.format(amount);
}

/**
 * Format number with thousand separator
 * e.g., 1500000 → "1.500.000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Format currency with explicit +/- sign
 * e.g., 1500000 -> "+Rp1.500.000", -1500000 -> "-Rp1.500.000"
 */
export function formatSignedCurrency(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : `+${formatted}`;
}

/**
 * Parse display string back to integer
 * Handles: "1.500.000" → 1500000
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Calculate percentage
 */
export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}
