/**
 * Egyptian-first phone helpers. Accepts:
 *   - Local: 01XXXXXXXXX (11 digits, starts with 010/011/012/015)
 *   - International: +201XXXXXXXXX or 00201XXXXXXXXX
 *
 * Wasalni is launching in Bagour, Egypt. We deliberately keep this narrow
 * for now — multi-country support gets a real library (libphonenumber-js)
 * when expansion lands.
 */

const EG_LOCAL_PREFIX = /^01[0125]\d{8}$/;
const EG_INTL_PREFIX = /^(?:\+?20|0020)1[0125]\d{8}$/;

export type Country = 'EG';

export interface NormalizedPhone {
  e164: string;
  national: string;
  country: Country;
}

/**
 * Normalize an Egyptian phone number to E.164 form (+201XXXXXXXXX).
 * Returns null when the input is not a valid Egyptian mobile.
 */
export function normalizeEgPhone(raw: string): NormalizedPhone | null {
  const cleaned = raw.replace(/[\s\-()]/g, '');

  if (EG_LOCAL_PREFIX.test(cleaned)) {
    return {
      e164: `+20${cleaned.slice(1)}`,
      national: cleaned,
      country: 'EG',
    };
  }

  if (EG_INTL_PREFIX.test(cleaned)) {
    const digitsOnly = cleaned.replace(/^(?:\+?20|0020)/, '');
    return {
      e164: `+20${digitsOnly}`,
      national: `0${digitsOnly}`,
      country: 'EG',
    };
  }

  return null;
}

/** True iff the input parses as a valid Egyptian mobile. */
export function isValidEgPhone(raw: string): boolean {
  return normalizeEgPhone(raw) !== null;
}

/**
 * Pretty national display: "010 1234 5678".
 * Returns the raw input unchanged when not parseable.
 */
export function formatEgPhoneDisplay(raw: string): string {
  const normalized = normalizeEgPhone(raw);
  if (!normalized) return raw;
  const n = normalized.national;
  return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`;
}

/**
 * Mask middle digits for privacy in receipts/notifications:
 *   "01012345678" → "010 ••• •678"
 */
export function maskPhone(raw: string): string {
  const normalized = normalizeEgPhone(raw);
  if (!normalized) return raw;
  const n = normalized.national;
  return `${n.slice(0, 3)} ••• •${n.slice(-3)}`;
}
