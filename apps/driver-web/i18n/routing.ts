import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@wasalni/i18n';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});
