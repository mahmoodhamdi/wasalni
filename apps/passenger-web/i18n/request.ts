import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { isLocale } from '@wasalni/i18n';
import sharedAr from '@wasalni/i18n/messages/ar';
import sharedEn from '@wasalni/i18n/messages/en';
import { routing } from './routing';

/**
 * Server-side message resolution for next-intl. Merges shared catalogues
 * from @wasalni/i18n with app-specific overrides under /messages/*.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const appMessages = (await import(`../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;
  const sharedMessages = isLocale(locale) && locale === 'ar' ? sharedAr : sharedEn;

  return {
    locale,
    messages: {
      ...(sharedMessages as Record<string, unknown>),
      ...appMessages,
    },
  };
});
