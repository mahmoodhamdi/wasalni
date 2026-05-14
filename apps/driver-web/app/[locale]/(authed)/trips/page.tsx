import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { DriverTripsHistory } from '../../../../components/trip/driver-trips-history';

export default async function TripsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DriverTripsHistory locale={locale} />;
}
