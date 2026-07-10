import { describe, it, expect } from 'vitest';
import { getLevelTitle } from './xp';

describe('getLevelTitle', () => {
  it('should return the correct title for normal levels', () => {
    expect(getLevelTitle(1)).toBe('Pemula Keuangan');
    expect(getLevelTitle(2)).toBe('Pencatat Rajin');
    expect(getLevelTitle(5)).toBe('Budget Master');
    expect(getLevelTitle(10)).toBe('Financial Expert');
    expect(getLevelTitle(15)).toBe('Diamond Legend');
  });

  it('should return the highest title for levels exceeding the maximum', () => {
    expect(getLevelTitle(16)).toBe('Diamond Legend');
    expect(getLevelTitle(50)).toBe('Diamond Legend');
    expect(getLevelTitle(999)).toBe('Diamond Legend');
  });

  it('should return the lowest title for levels below 1', () => {
    expect(getLevelTitle(0)).toBe('Pemula Keuangan');
    expect(getLevelTitle(-1)).toBe('Pemula Keuangan');
    expect(getLevelTitle(-100)).toBe('Pemula Keuangan');
  });
});
