import { describe, expect, it } from 'vitest';
import { cn } from '../src/lib/cn';

describe('cn', () => {
  it('joins simple strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('filters out falsey values', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });
  it('resolves conflicting Tailwind utilities (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
  it('preserves non-conflicting utilities', () => {
    expect(cn('rounded', 'p-2')).toBe('rounded p-2');
  });
  it('handles conditional objects', () => {
    expect(cn({ a: true, b: false }, 'c')).toBe('a c');
  });
});
