import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatEta, formatRelative, formatTime } from '../src/date';

const fixed = new Date('2026-05-13T14:30:00Z');

describe('formatDateTime / formatDate / formatTime', () => {
  it('returns a non-empty string for English', () => {
    expect(formatDateTime(fixed, 'en-EG').length).toBeGreaterThan(5);
    expect(formatDate(fixed, 'en-EG').length).toBeGreaterThan(3);
    expect(formatTime(fixed, 'en-EG').length).toBeGreaterThan(3);
  });
  it('accepts a string or number input', () => {
    expect(formatDate(fixed.toISOString(), 'en-EG').length).toBeGreaterThan(3);
    expect(formatDate(fixed.getTime(), 'en-EG').length).toBeGreaterThan(3);
  });
});

describe('formatRelative', () => {
  const ref = new Date('2026-05-13T12:00:00Z');

  it('reports seconds for very recent', () => {
    const r = formatRelative(new Date('2026-05-13T11:59:30Z'), 'en-EG', ref);
    expect(r).toMatch(/second|sec/i);
  });
  it('reports minutes', () => {
    const r = formatRelative(new Date('2026-05-13T11:55:00Z'), 'en-EG', ref);
    expect(r).toMatch(/minute|min/i);
  });
  it('reports hours', () => {
    const r = formatRelative(new Date('2026-05-13T10:00:00Z'), 'en-EG', ref);
    expect(r).toMatch(/hour|hr/i);
  });
  it('reports days', () => {
    const r = formatRelative(new Date('2026-05-10T12:00:00Z'), 'en-EG', ref);
    expect(r).toMatch(/day|days|d/i);
  });
  it('reports weeks', () => {
    const r = formatRelative(new Date('2026-04-29T12:00:00Z'), 'en-EG', ref);
    expect(r).toMatch(/week|wk/i);
  });
  it('reports months', () => {
    const r = formatRelative(new Date('2026-01-13T12:00:00Z'), 'en-EG', ref);
    expect(r).toMatch(/month|mo/i);
  });
  it('reports years', () => {
    const r = formatRelative(new Date('2024-05-13T12:00:00Z'), 'en-EG', ref);
    expect(r).toMatch(/year|yr/i);
  });
});

describe('formatEta', () => {
  it('returns "less than a minute" for under 60 s', () => {
    expect(formatEta(30, 'en-EG')).toBe('less than a minute');
    expect(formatEta(30, 'ar-EG')).toBe('أقل من دقيقة');
  });
  it('returns minutes for under an hour', () => {
    expect(formatEta(180, 'en-EG')).toBe('3 min');
    expect(formatEta(180, 'ar-EG')).toMatch(/3 دقيقة/);
  });
  it('returns hours when ≥ 1 h with no remainder', () => {
    expect(formatEta(3600, 'en-EG')).toBe('1 h');
  });
  it('returns hours + minutes when there is a remainder', () => {
    expect(formatEta(3900, 'en-EG')).toBe('1h 5m');
    expect(formatEta(3900, 'ar-EG')).toMatch(/1 س 5 د/);
  });
});
