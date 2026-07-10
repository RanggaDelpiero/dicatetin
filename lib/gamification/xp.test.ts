import { describe, it, expect } from 'vitest';
import { calculateLevel } from './xp';

describe('calculateLevel', () => {
  it('should return level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('should return level 1 for XP just below the level 2 threshold', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('should return level 2 exactly at the level 2 threshold', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('should return the correct level for intermediate values', () => {
    expect(calculateLevel(250)).toBe(3);
    expect(calculateLevel(800)).toBe(5);
    expect(calculateLevel(5200)).toBe(11);
  });

  it('should return level 15 (max level) exactly at the level 15 threshold', () => {
    expect(calculateLevel(12500)).toBe(15);
  });

  it('should continue returning level 15 for XP exceeding the max threshold', () => {
    expect(calculateLevel(15000)).toBe(15);
    expect(calculateLevel(100000)).toBe(15);
  });

  it('should return level 1 for negative XP', () => {
    expect(calculateLevel(-10)).toBe(1);
  });
});
