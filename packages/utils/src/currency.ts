/**
 * Currency helpers — Wasalni operates in EGP today but model the surface
 * for future multi-currency without hard-coding.
 */

export type CurrencyCode = 'EGP';

export interface FormatMoneyOptions {
  currency?: CurrencyCode;
  locale?: 'ar-EG' | 'en-EG';
  /** True hides the currency symbol (e.g. for input fields). */
  bare?: boolean;
  /** Override the default 2 decimal places. */
  digits?: number;
}

/**
 * Format an amount (in major units, e.g. pounds — not piastres) for display.
 * Defaults to Arabic-EG locale + EGP symbol.
 */
export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  const { currency = 'EGP', locale = 'ar-EG', bare = false, digits = 2 } = options;

  if (bare) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Minor (piastres) → major (pounds). 100 piastres = 1 EGP. */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/** Major (pounds) → minor (piastres). Rounded to handle float noise. */
export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}
