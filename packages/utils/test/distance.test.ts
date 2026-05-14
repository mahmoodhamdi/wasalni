import { describe, expect, it } from 'vitest';
import {
  bearingDegrees,
  formatDistance,
  haversineKm,
  haversineMeters,
  withinRadius,
} from '../src/distance';

const cairo = { latitude: 30.0444, longitude: 31.2357 };
const giza = { latitude: 30.0131, longitude: 31.2089 };

describe('haversine distance', () => {
  it('returns ~0 for the same point', () => {
    expect(haversineMeters(cairo, cairo)).toBeLessThan(1);
  });

  it('Cairo → Giza is roughly 4–5 km', () => {
    const m = haversineMeters(cairo, giza);
    expect(m).toBeGreaterThan(3500);
    expect(m).toBeLessThan(6000);
  });

  it('haversineKm rounds to 2 decimals', () => {
    const km = haversineKm(cairo, giza);
    expect(km).toBeGreaterThan(3.5);
    expect(km).toBeLessThan(6);
    expect(km).toBe(Math.round(km * 100) / 100);
  });
});

describe('bearingDegrees', () => {
  it('returns a number 0..360', () => {
    const b = bearingDegrees(cairo, giza);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });

  it('north of north is ~0', () => {
    const b = bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(b).toBeCloseTo(0, 0);
  });

  it('east of equator is ~90', () => {
    const b = bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(b).toBeCloseTo(90, 0);
  });
});

describe('withinRadius', () => {
  it('true when inside the radius', () => {
    expect(withinRadius(cairo, cairo, 10)).toBe(true);
  });

  it('false when outside the radius', () => {
    expect(withinRadius(cairo, giza, 100)).toBe(false);
  });
});

describe('formatDistance', () => {
  it('uses metres under 1 km (Arabic by default)', () => {
    expect(formatDistance(500)).toMatch(/500\s?م/u);
  });

  it('uses km past 1 km (Arabic)', () => {
    expect(formatDistance(1500)).toMatch(/1\.5\s?كم/u);
  });

  it('respects the English locale', () => {
    expect(formatDistance(500, 'en-EG')).toBe('500 m');
    expect(formatDistance(2300, 'en-EG')).toBe('2.3 km');
  });
});
