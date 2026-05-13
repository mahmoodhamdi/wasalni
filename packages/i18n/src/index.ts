/**
 * Locale primitives shared by every Wasalni web app.
 *
 * Apps wire next-intl to consume `messages/ar.json` and `messages/en.json`
 * directly — these are intentionally JSON (not TS) so they can be loaded
 * by any tooling, including next-intl AOT compilation.
 */

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const rtlLocales: ReadonlySet<Locale> = new Set(['ar']);

export type Direction = 'rtl' | 'ltr';

export function getDirection(locale: Locale): Direction {
  return rtlLocales.has(locale) ? 'rtl' : 'ltr';
}

export function isLocale(value: string): value is Locale {
  return (locales as ReadonlyArray<string>).includes(value);
}

export const localeLabels: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
};
