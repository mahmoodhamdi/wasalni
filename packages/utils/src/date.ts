/**
 * Date helpers for trips, earnings, scheduling. Avoid pulling in a heavy
 * date library — Intl + small helpers covers everything we need.
 */

export type Locale = 'ar-EG' | 'en-EG';

export function formatDateTime(input: Date | string | number, locale: Locale = 'ar-EG'): string {
  const d = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatDate(input: Date | string | number, locale: Locale = 'ar-EG'): string {
  const d = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

export function formatTime(input: Date | string | number, locale: Locale = 'ar-EG'): string {
  const d = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(d);
}

/**
 * Relative time: "5 minutes ago" / "in 3 hours" / "just now".
 * Honours the requested locale; Arabic strings are translated by Intl.
 */
export function formatRelative(
  input: Date | string | number,
  locale: Locale = 'ar-EG',
  reference: Date = new Date(),
): string {
  const target = input instanceof Date ? input : new Date(input);
  const diffMs = target.getTime() - reference.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSec < 45) return rtf.format(diffSec, 'second');
  if (absSec < 2700) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (absSec < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (absSec < 604_800) return rtf.format(Math.round(diffSec / 86_400), 'day');
  if (absSec < 2_628_000) return rtf.format(Math.round(diffSec / 604_800), 'week');
  if (absSec < 31_536_000) return rtf.format(Math.round(diffSec / 2_628_000), 'month');
  return rtf.format(Math.round(diffSec / 31_536_000), 'year');
}

/** Human ETA: 18 seconds → "less than a minute", 750 seconds → "13 min". */
export function formatEta(seconds: number, locale: Locale = 'ar-EG'): string {
  if (seconds < 60) {
    return locale === 'ar-EG' ? 'أقل من دقيقة' : 'less than a minute';
  }
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} ${locale === 'ar-EG' ? 'دقيقة' : 'min'}`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (locale === 'ar-EG') {
    return rem === 0 ? `${hours} ساعة` : `${hours} س ${rem} د`;
  }
  return rem === 0 ? `${hours} h` : `${hours}h ${rem}m`;
}
