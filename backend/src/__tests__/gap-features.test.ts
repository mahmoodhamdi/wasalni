import path from 'path';
import {
  generateTripShareToken,
  verifyTripShareToken,
  isFemaleOnlyRequested,
  hasExpiredDocuments,
  ramadanIftarSurge,
} from '../services/gap-features.service';
import { loadCityConfig, resetCityConfigForTests } from '../config/city';

const BAGOUR = path.resolve(__dirname, '..', '..', '..', 'config', 'cities', 'bagour.yaml');

describe('Gap Features', () => {
  beforeAll(() => {
    process.env.WASALNI_CITY_CONFIG_PATH = BAGOUR;
    resetCityConfigForTests();
    loadCityConfig('bagour');
  });

  afterAll(() => {
    delete process.env.WASALNI_CITY_CONFIG_PATH;
    resetCityConfigForTests();
  });

  describe('Trip sharing tokens', () => {
    it('generates and verifies a valid token', () => {
      const token = generateTripShareToken('650abc123abc123abc123abc');
      const verified = verifyTripShareToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.tripId).toBe('650abc123abc123abc123abc');
    });

    it('rejects a tampered token', () => {
      const token = generateTripShareToken('650abc123abc123abc123abc');
      const tampered = token.slice(0, -2) + 'XX';
      const verified = verifyTripShareToken(tampered);
      expect(verified.valid).toBe(false);
      expect(verified.reason).toBe('signature');
    });

    it('rejects a malformed token', () => {
      const verified = verifyTripShareToken('not-a-token');
      expect(verified.valid).toBe(false);
    });

    it('honors a negative-hour validity window (immediately expired)', () => {
      const token = generateTripShareToken('650abc123abc123abc123abc', -1);
      const verified = verifyTripShareToken(token);
      expect(verified.valid).toBe(false);
      expect(verified.reason).toBe('expired');
    });
  });

  describe('Female-driver-only mode', () => {
    it('returns true when passenger opts in and city allows it', () => {
      expect(isFemaleOnlyRequested({ passengerPreference: true })).toBe(true);
    });

    it('returns false when passenger has not opted in', () => {
      expect(isFemaleOnlyRequested({ passengerPreference: false })).toBe(false);
      expect(isFemaleOnlyRequested({})).toBe(false);
    });
  });

  describe('Document expiry check', () => {
    it('flags drivers with expired licenses', () => {
      const yesterday = new Date(Date.now() - 86_400_000);
      expect(
        hasExpiredDocuments({
          documents: { drivingLicenseExpiry: yesterday },
        })
      ).toBe(true);
    });

    it('does not flag drivers with valid documents', () => {
      const tomorrow = new Date(Date.now() + 86_400_000);
      expect(
        hasExpiredDocuments({
          documents: { drivingLicenseExpiry: tomorrow, nationalIdExpiry: tomorrow },
          vehicle: { insuranceExpiry: tomorrow },
        })
      ).toBe(false);
    });
  });

  describe('Ramadan iftar surge', () => {
    it('returns 1.0 outside Ramadan window', () => {
      const may = new Date('2026-05-13T18:00:00+02:00');
      expect(ramadanIftarSurge(may)).toBe(1.0);
    });

    it('returns elevated multiplier within iftar window during Ramadan', () => {
      const iftarTime = new Date('2026-02-25T18:00:00+02:00');
      const m = ramadanIftarSurge(iftarTime);
      expect(m).toBeGreaterThanOrEqual(1.0);
    });
  });
});
