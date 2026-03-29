import { describe, it, expect } from 'vitest';
import { clamp, roundToStep, convertValueToPercentage } from './number';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, [0, 10])).toBe(5);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-5, [0, 10])).toBe(0);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, [0, 10])).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, [0, 10])).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, [0, 10])).toBe(10);
  });

  it('works with negative ranges', () => {
    expect(clamp(-3, [-5, -1])).toBe(-3);
    expect(clamp(0, [-5, -1])).toBe(-1);
    expect(clamp(-10, [-5, -1])).toBe(-5);
  });
});

describe('roundToStep', () => {
  it('rounds down to nearest step', () => {
    expect(roundToStep(3, 0, 5)).toBe(5); // (3-0)/5 = 0.6 → round to 1 → 5
  });

  it('rounds to nearest step from min', () => {
    expect(roundToStep(7, 0, 5)).toBe(5);
    expect(roundToStep(8, 0, 5)).toBe(10);
  });

  it('returns value unchanged when already on a step', () => {
    expect(roundToStep(5, 0, 5)).toBe(5);
    expect(roundToStep(10, 0, 5)).toBe(10);
    expect(roundToStep(0, 0, 5)).toBe(0);
  });

  it('works with non-zero min', () => {
    expect(roundToStep(2, 2, 2)).toBe(2);
    expect(roundToStep(3, 2, 2)).toBe(4);
  });

  it('works with decimal steps', () => {
    expect(roundToStep(0.4, 0, 0.5)).toBe(0.5);
    expect(roundToStep(0.2, 0, 0.5)).toBe(0);
  });
});

describe('convertValueToPercentage', () => {
  it('returns 0 for min value', () => {
    expect(convertValueToPercentage(0, 0, 10)).toBe(0);
  });

  it('returns 100 for max value', () => {
    expect(convertValueToPercentage(10, 0, 10)).toBe(100);
  });

  it('returns 50 for midpoint', () => {
    expect(convertValueToPercentage(5, 0, 10)).toBe(50);
  });

  it('works with non-zero min', () => {
    expect(convertValueToPercentage(5, 5, 15)).toBe(0);
    expect(convertValueToPercentage(15, 5, 15)).toBe(100);
    expect(convertValueToPercentage(10, 5, 15)).toBe(50);
  });

  it('works with negative ranges', () => {
    expect(convertValueToPercentage(0, -10, 10)).toBe(50);
  });
});
