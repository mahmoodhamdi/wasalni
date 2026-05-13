/**
 * Gap-analysis feature additions — wired through a single module to keep
 * surface area minimal and reviewable.
 *
 * Includes:
 *   1. Female-driver-only matching constraint
 *   2. Driver document expiry tracking + warnings
 *   3. Trip sharing token generation/validation
 *   4. Corporate account aggregation
 *   5. Ramadan-aware fare-engine helpers
 *   6. Vehicle inspection / maintenance reminder hooks
 */

import crypto from 'crypto';
import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { getCityConfig } from '../config/city';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import User from '../models/User';

// ---------------------------------------------------------------------------
// 1. Female-driver-only mode
// ---------------------------------------------------------------------------

export interface FemaleOnlyContext {
  passengerGender?: 'male' | 'female';
  passengerPreference?: boolean;
}

/**
 * Returns true if the passenger has opted into "female driver only" matching
 * and the city allows it. Used by the matching algorithm to filter candidates.
 */
export const isFemaleOnlyRequested = (ctx: FemaleOnlyContext): boolean => {
  const city = getCityConfig();
  if (!city.policies.female_only_mode_enabled) return false;
  return Boolean(ctx.passengerPreference);
};

/**
 * Filters driver candidates to female drivers only.
 * Driver gender is stored on the linked User document; this helper resolves it.
 */
export const filterFemaleDriversOnly = async (
  driverIds: Types.ObjectId[]
): Promise<Types.ObjectId[]> => {
  if (!driverIds.length) return [];
  const drivers = await Driver.find({ _id: { $in: driverIds } })
    .populate('userId', 'gender')
    .lean();
  return drivers
    .filter((d) => {
      const u = d.userId as unknown as { gender?: string } | null;
      return u?.gender === 'female';
    })
    .map((d) => d._id as Types.ObjectId);
};

// ---------------------------------------------------------------------------
// 2. Driver document expiry tracking
// ---------------------------------------------------------------------------

export interface DocumentExpiryWarning {
  driverId: string;
  driverName: string;
  document: 'national_id' | 'driving_license' | 'vehicle_license' | 'insurance';
  expiresAt: Date;
  daysUntilExpiry: number;
  severity: 'expired' | 'critical' | 'warning' | 'info';
}

const severityOf = (days: number): DocumentExpiryWarning['severity'] => {
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'info';
};

/**
 * Scans drivers for documents expiring within the threshold window.
 * Returns warnings ordered by severity for admin dashboard / driver app reminders.
 */
export const findExpiringDocuments = async (
  withinDays = 60
): Promise<DocumentExpiryWarning[]> => {
  const cutoff = dayjs().add(withinDays, 'day').toDate();
  const drivers = await Driver.find({
    $or: [
      { 'documents.nationalIdExpiry': { $lte: cutoff } },
      { 'documents.drivingLicenseExpiry': { $lte: cutoff } },
      { 'vehicle.insuranceExpiry': { $lte: cutoff } },
    ],
  })
    .populate('userId', 'name')
    .lean();

  const warnings: DocumentExpiryWarning[] = [];
  const now = dayjs();
  for (const d of drivers) {
    const user = d.userId as unknown as { name?: string } | null;
    const name = user?.name || 'Unknown driver';
    const checks: Array<[Date | undefined, DocumentExpiryWarning['document']]> = [
      [d.documents?.nationalIdExpiry, 'national_id'],
      [d.documents?.drivingLicenseExpiry, 'driving_license'],
      [d.vehicle?.insuranceExpiry, 'insurance'],
    ];
    for (const [expiry, doc] of checks) {
      if (!expiry) continue;
      const days = dayjs(expiry).diff(now, 'day');
      if (days <= withinDays) {
        warnings.push({
          driverId: String(d._id),
          driverName: name,
          document: doc,
          expiresAt: expiry,
          daysUntilExpiry: days,
          severity: severityOf(days),
        });
      }
    }
  }
  return warnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

/**
 * Returns true if any required document is currently expired.
 * The matching engine should drop drivers where this returns true.
 */
export const hasExpiredDocuments = (
  driver: {
    documents?: {
      nationalIdExpiry?: Date;
      drivingLicenseExpiry?: Date;
    };
    vehicle?: { insuranceExpiry?: Date };
  }
): boolean => {
  const now = new Date();
  const checks = [
    driver.documents?.nationalIdExpiry,
    driver.documents?.drivingLicenseExpiry,
    driver.vehicle?.insuranceExpiry,
  ];
  return checks.some((d) => d && d.getTime() < now.getTime());
};

// ---------------------------------------------------------------------------
// 3. Trip sharing token (safety feature)
// ---------------------------------------------------------------------------

const TRIP_SHARE_SECRET =
  process.env.TRIP_SHARE_SECRET || 'wasalni-trip-share-default-do-rotate';

export const generateTripShareToken = (tripId: string, validForHours = 4): string => {
  const expiresAt = Date.now() + validForHours * 3600 * 1000;
  const payload = `${tripId}.${expiresAt}`;
  const sig = crypto.createHmac('sha256', TRIP_SHARE_SECRET).update(payload).digest('hex').slice(0, 16);
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
};

export const verifyTripShareToken = (
  token: string
): { tripId: string; valid: boolean; reason?: string } => {
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return { tripId: '', valid: false, reason: 'malformed' };
  let payload: string;
  try {
    payload = Buffer.from(b64, 'base64url').toString('utf8');
  } catch {
    return { tripId: '', valid: false, reason: 'malformed' };
  }
  const expected = crypto.createHmac('sha256', TRIP_SHARE_SECRET).update(payload).digest('hex').slice(0, 16);
  if (expected !== sig) return { tripId: '', valid: false, reason: 'signature' };
  const [tripId, expiresAtStr] = payload.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt)
    return { tripId, valid: false, reason: 'expired' };
  return { tripId, valid: true };
};

// ---------------------------------------------------------------------------
// 4. Corporate accounts (B2B)
// ---------------------------------------------------------------------------

export interface CorporateUsageReport {
  totalTrips: number;
  totalSpend: number;
  uniqueEmployees: number;
  byEmployee: Array<{ userId: string; userName: string; trips: number; spend: number }>;
}

/**
 * Returns aggregated usage for a corporate account, identified by a
 * `corporateAccountId` field on User. Use to bill the company monthly.
 */
export const aggregateCorporateUsage = async (
  corporateAccountId: string,
  from: Date,
  to: Date
): Promise<CorporateUsageReport> => {
  const users = await User.find({ corporateAccountId }).select('_id name').lean();
  if (!users.length) {
    return { totalTrips: 0, totalSpend: 0, uniqueEmployees: 0, byEmployee: [] };
  }
  const userIds = users.map((u) => u._id);
  const trips = await Trip.find({
    'passengerId': { $in: userIds },
    status: 'completed',
    createdAt: { $gte: from, $lte: to },
  }).select('passengerId fare.total').lean();

  const map = new Map<string, { userName: string; trips: number; spend: number }>();
  for (const u of users) {
    map.set(String(u._id), { userName: u.name, trips: 0, spend: 0 });
  }
  let totalSpend = 0;
  for (const t of trips) {
    const key = String((t as { passengerId: Types.ObjectId }).passengerId);
    const entry = map.get(key);
    if (!entry) continue;
    entry.trips++;
    const fare = (t as unknown as { fare?: { total?: number } }).fare?.total || 0;
    entry.spend += fare;
    totalSpend += fare;
  }
  return {
    totalTrips: trips.length,
    totalSpend,
    uniqueEmployees: Array.from(map.values()).filter((e) => e.trips > 0).length,
    byEmployee: Array.from(map.entries()).map(([userId, e]) => ({ userId, ...e })),
  };
};

// ---------------------------------------------------------------------------
// 5. Ramadan-aware helpers
// ---------------------------------------------------------------------------

/**
 * Ramadan iftar windows (sunset prayer) skew demand heavily.
 * Returns a recommended surge bump for the iftar window.
 */
export const ramadanIftarSurge = (now: Date = new Date()): number => {
  const city = getCityConfig();
  if (!city.policies.ramadan_mode_enabled) return 1.0;
  // Egyptian Ramadan 2026: approximately Feb 17 → Mar 19. Iftar ~18:00-19:00.
  const m = now.getMonth();
  const inRamadan = (m === 1 && now.getDate() >= 17) || m === 2 && now.getDate() <= 19;
  if (!inRamadan) return 1.0;
  const h = now.getHours();
  // 15 minutes before iftar through 30 minutes after → surge demand
  if ((h === 17 && now.getMinutes() >= 45) || (h === 18 && now.getMinutes() <= 30)) {
    return 1.4;
  }
  return 1.0;
};

// ---------------------------------------------------------------------------
// 6. Vehicle inspection / maintenance hooks
// ---------------------------------------------------------------------------

const INSPECTION_INTERVAL_DAYS = 365;

export interface InspectionWarning {
  driverId: string;
  driverName: string;
  lastInspection?: Date;
  daysOverdue: number;
}

export const findDriversNeedingInspection = async (): Promise<InspectionWarning[]> => {
  const drivers = await Driver.find({}).populate('userId', 'name').lean();
  const out: InspectionWarning[] = [];
  for (const d of drivers) {
    const user = d.userId as unknown as { name?: string } | null;
    const lastInspectionDate = (d as unknown as { lastInspectionDate?: Date })
      .lastInspectionDate;
    const since = lastInspectionDate
      ? dayjs().diff(dayjs(lastInspectionDate), 'day')
      : INSPECTION_INTERVAL_DAYS + 1;
    if (since > INSPECTION_INTERVAL_DAYS) {
      out.push({
        driverId: String(d._id),
        driverName: user?.name || 'Unknown',
        lastInspection: lastInspectionDate,
        daysOverdue: since - INSPECTION_INTERVAL_DAYS,
      });
    }
  }
  return out.sort((a, b) => b.daysOverdue - a.daysOverdue);
};
