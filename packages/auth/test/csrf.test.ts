import { describe, expect, it } from 'vitest';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  generateCsrfToken,
  safeEqual,
} from '../src/index';

describe('constants', () => {
  it('cookie/header names are non-empty strings', () => {
    expect(SESSION_COOKIE.length).toBeGreaterThan(0);
    expect(CSRF_COOKIE.length).toBeGreaterThan(0);
    expect(CSRF_HEADER.length).toBeGreaterThan(0);
  });
  it('session max age matches backend JWT (7 days)', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 7);
  });
});

describe('generateCsrfToken', () => {
  it('returns 48 hex characters (24 bytes)', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{48}$/);
  });
  it('returns a different token on each call', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
  });
});

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
  });
  it('returns false for different strings of equal length', () => {
    expect(safeEqual('abc', 'abd')).toBe(false);
  });
  it('returns false for strings of different lengths', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
