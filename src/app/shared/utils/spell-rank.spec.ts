import { describe, it, expect } from 'vitest';
import { getSpellRanks } from './spell-rank';

describe('getSpellRanks', () => {
  it('returns [1,0,0,0] at level 1', () => {
    expect(getSpellRanks(1)).toEqual([1, 0, 0, 0]);
  });

  it('returns correct ranks at level 6 (first R point)', () => {
    expect(getSpellRanks(6)).toEqual([3, 1, 1, 1]);
  });

  it('returns correct ranks at level 11 (second R point)', () => {
    expect(getSpellRanks(11)).toEqual([5, 1, 3, 2]);
  });

  it('returns correct ranks at level 16 (third R point)', () => {
    expect(getSpellRanks(16)).toEqual([5, 3, 5, 3]);
  });

  it('returns [5,5,5,3] at level 18 (max)', () => {
    expect(getSpellRanks(18)).toEqual([5, 5, 5, 3]);
  });

  it('clamps level 0 to level 1', () => {
    expect(getSpellRanks(0)).toEqual(getSpellRanks(1));
  });

  it('clamps level above 18 to level 18', () => {
    expect(getSpellRanks(99)).toEqual(getSpellRanks(18));
  });

  it('returns a new array each call (no shared reference)', () => {
    const a = getSpellRanks(1);
    const b = getSpellRanks(1);
    a[0] = 99;
    expect(b[0]).toBe(1);
  });

  it('Q rank is always the highest non-R rank at every level', () => {
    for (let lvl = 1; lvl <= 18; lvl++) {
      const [q, w, e] = getSpellRanks(lvl);
      expect(q).toBeGreaterThanOrEqual(w);
      expect(q).toBeGreaterThanOrEqual(e);
    }
  });

  it('total skill points equal champion level', () => {
    for (let lvl = 1; lvl <= 18; lvl++) {
      const ranks = getSpellRanks(lvl);
      const total = ranks.reduce((s, r) => s + r, 0);
      expect(total).toBe(lvl);
    }
  });
});
