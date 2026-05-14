import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { DriverActiveTrip } from '../../../../../components/trip/driver-active-trip';

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DriverActiveTrip tripId={id} locale={locale} />;
}
