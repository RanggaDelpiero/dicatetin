import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  parseCurrencyInput,
  formatSignedCurrency,
  calcPercentage,
} from './currency';

describe('currency utilities', () => {
  describe('formatCurrency', () => {
    it('formats zero correctly', () => {
      // The exact space character used by Intl.NumberFormat might be a non-breaking space
      // so we use a regex or check just the numeric part, or exact string matching depending on the Node version's ICU data.
      // Usually it's "Rp 0" or "Rp0" depending on locale data.
      // id-ID currency formatting typically produces "Rp1.500.000" or "Rp 1.500.000".
      // We can normalize the space to be safe, or just test exact output.
      const formatted = formatCurrency(0);
      expect(formatted).toMatch(/Rp\s*0/);
    });

    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1500000)).toMatch(/Rp\s*1\.500\.000/);
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1500000)).toMatch(/-Rp\s*1\.500\.000/);
    });
  });

  describe('formatCurrencyCompact', () => {
    it('formats numbers less than 1 million normally or compactly', () => {
      // e.g. 500,000 might be Rp 500 rb or something similar depending on the environment
      expect(formatCurrencyCompact(500000)).toMatch(/Rp\s*500\s*rb/);
    });

    it('formats millions compactly', () => {
      expect(formatCurrencyCompact(1500000)).toMatch(/Rp\s*1,5\s*jt/);
    });

    it('formats billions compactly', () => {
      expect(formatCurrencyCompact(1500000000)).toMatch(/Rp\s*1,5\s*M/);
    });
  });

  describe('formatNumber', () => {
    it('formats with thousand separator', () => {
      expect(formatNumber(1500000)).toBe('1.500.000');
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses valid input correctly', () => {
      expect(parseCurrencyInput('1.500.000')).toBe(1500000);
      expect(parseCurrencyInput('Rp 1.500.000')).toBe(1500000);
      expect(parseCurrencyInput('1500000')).toBe(1500000);
    });

    it('returns 0 for empty or invalid input', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
    });
  });

  describe('formatSignedCurrency', () => {
    it('adds a + prefix for positive numbers', () => {
      expect(formatSignedCurrency(1500000)).toMatch(/\+Rp\s*1\.500\.000/);
    });

    it('adds a + prefix for zero', () => {
      expect(formatSignedCurrency(0)).toMatch(/\+Rp\s*0/);
    });

    it('does not add a + prefix for negative numbers', () => {
      expect(formatSignedCurrency(-1500000)).toMatch(/-Rp\s*1\.500\.000/);
    });
  });

  describe('calcPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calcPercentage(50, 200)).toBe(25);
    });

    it('rounds to the nearest integer', () => {
      expect(calcPercentage(1, 3)).toBe(33);
      expect(calcPercentage(2, 3)).toBe(67);
    });

    it('returns 0 when total is 0', () => {
      expect(calcPercentage(50, 0)).toBe(0);
    });
  });
});
