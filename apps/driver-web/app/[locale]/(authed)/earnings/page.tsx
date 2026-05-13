import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { EarningsScreen } from '../../../../components/earnings/earnings-screen';

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EarningsScreen locale={locale} />;
}
