import { describe, expect, it } from 'vitest';
import { formatMoney, majorToMinor, minorToMajor } from '../src/currency';

describe('formatMoney', () => {
  it('formats EGP in Arabic-EG locale by default', () => {
    const out = formatMoney(123.45);
    // Different Node versions render the symbol slightly differently;
    // we just assert the numeric part and that some currency hint is there.
    expect(out).toMatch(/١٢٣[٫.]٤٥|123[.,]45/);
    // The string contains either "ج.م" (Arabic) or "EGP"
    expect(/ج\.?\s?م|EGP|E£/u.test(out)).toBe(true);
  });

  it('respects an english locale', () => {
    const out = formatMoney(99.99, { locale: 'en-EG' });
    expect(out).toContain('99.99');
  });

  it('honours the bare flag (no symbol)', () => {
    const out = formatMoney(50, { bare: true });
    expect(/EGP|ج/u.test(out)).toBe(false);
    // ar-EG renders 50 as ٥٠ (Arabic-Indic digits)
    expect(/50|٥٠/u.test(out)).toBe(true);
  });

  it('honours the digits override', () => {
    const out = formatMoney(50, { bare: true, digits: 0 });
    expect(out).toMatch(/^[0-9٠-٩]+$/u);
  });
});

describe('major/minor units', () => {
  it('minorToMajor converts piastres to pounds', () => {
    expect(minorToMajor(12345)).toBeCloseTo(123.45);
  });
  it('majorToMinor rounds float noise', () => {
    // 0.1 + 0.2 = 0.30000000000000004 → 30 piastres
    expect(majorToMinor(0.1 + 0.2)).toBe(30);
  });
});
