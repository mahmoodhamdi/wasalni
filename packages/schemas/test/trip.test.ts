import { describe, expect, it } from 'vitest';
import {
  bookTripSchema,
  cancelTripSchema,
  fareEstimateSchema,
  vehicleTypeSchema,
} from '../src/trip';

const validLoc = (extra?: Partial<{ address: string }>) => ({
  latitude: 30.04,
  longitude: 31.23,
  address: extra?.address ?? 'Cairo',
});

describe('vehicleTypeSchema', () => {
  it('accepts all five ride types', () => {
    for (const t of ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'] as const) {
      expect(vehicleTypeSchema.parse(t)).toBe(t);
    }
  });
  it('rejects unknown ride type', () => {
    expect(() => vehicleTypeSchema.parse('helicopter')).toThrow();
  });
});

describe('fareEstimateSchema', () => {
  it('accepts a minimal request', () => {
    expect(() =>
      fareEstimateSchema.parse({
        pickup: validLoc(),
        dropoff: validLoc({ address: 'Giza' }),
        rideType: 'economy',
      }),
    ).not.toThrow();
  });
  it('accepts up to 3 stops', () => {
    expect(() =>
      fareEstimateSchema.parse({
        pickup: validLoc(),
        dropoff: validLoc(),
        rideType: 'economy',
        stops: [validLoc(), validLoc(), validLoc()],
      }),
    ).not.toThrow();
  });
  it('rejects more than 3 stops', () => {
    expect(() =>
      fareEstimateSchema.parse({
        pickup: validLoc(),
        dropoff: validLoc(),
        rideType: 'economy',
        stops: [validLoc(), validLoc(), validLoc(), validLoc()],
      }),
    ).toThrow();
  });
});

describe('bookTripSchema', () => {
  it('extends fareEstimate with paymentMethod', () => {
    const r = bookTripSchema.parse({
      pickup: validLoc(),
      dropoff: validLoc(),
      rideType: 'economy',
      paymentMethod: 'cash',
    });
    expect(r.paymentMethod).toBe('cash');
  });
  it('rejects unknown payment method', () => {
    expect(() =>
      bookTripSchema.parse({
        pickup: validLoc(),
        dropoff: validLoc(),
        rideType: 'economy',
        paymentMethod: 'bitcoin',
      }),
    ).toThrow();
  });
});

describe('cancelTripSchema', () => {
  it('defaults reason to passenger_cancelled', () => {
    const r = cancelTripSchema.parse({ tripId: 'abc' });
    expect(r.reason).toBe('passenger_cancelled');
  });
  it('caps comment at 280', () => {
    expect(() => cancelTripSchema.parse({ tripId: 'abc', comment: 'x'.repeat(281) })).toThrow();
  });
});
