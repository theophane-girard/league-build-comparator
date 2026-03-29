import { describe, it, expect } from 'vitest';
import { mergeClasses, noopFn } from './merge-classes';

describe('mergeClasses', () => {
  it('returns a single class unchanged', () => {
    expect(mergeClasses('foo')).toBe('foo');
  });

  it('joins multiple classes', () => {
    expect(mergeClasses('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts (keeps last)', () => {
    expect(mergeClasses('p-4', 'p-8')).toBe('p-8');
    expect(mergeClasses('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles conditional classes via objects', () => {
    expect(mergeClasses({ foo: true, bar: false })).toBe('foo');
  });

  it('ignores falsy values', () => {
    expect(mergeClasses('foo', undefined, null as never, false as never)).toBe('foo');
  });

  it('returns empty string with no arguments', () => {
    expect(mergeClasses()).toBe('');
  });

  it('handles arrays of classes', () => {
    expect(mergeClasses(['foo', 'bar'])).toBe('foo bar');
  });
});

describe('noopFn', () => {
  it('returns undefined', () => {
    expect(noopFn()).toBeUndefined();
  });

  it('can be called multiple times without side effects', () => {
    expect(() => { noopFn(); noopFn(); }).not.toThrow();
  });
});
