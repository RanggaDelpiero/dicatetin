import { describe, it, expect } from 'vitest';
import { parseCurrencyInput } from './currency';

describe('currency utilities', () => {
  describe('parseCurrencyInput', () => {
    it('should parse standard numeric string', () => {
      expect(parseCurrencyInput('1500000')).toBe(1500000);
    });

    it('should parse formatted currency string', () => {
      expect(parseCurrencyInput('1.500.000')).toBe(1500000);
      expect(parseCurrencyInput('1,500,000')).toBe(1500000);
    });

    it('should ignore currency symbols and alphabetic characters', () => {
      expect(parseCurrencyInput('Rp 1.000')).toBe(1000);
      expect(parseCurrencyInput('IDR 50.000')).toBe(50000);
      expect(parseCurrencyInput('100abc')).toBe(100);
    });

    it('should return 0 for empty or entirely non-numeric strings', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('abc')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
      expect(parseCurrencyInput('Rp')).toBe(0);
    });

    it('should handle zero correctly', () => {
      expect(parseCurrencyInput('0')).toBe(0);
    });
  });
});
