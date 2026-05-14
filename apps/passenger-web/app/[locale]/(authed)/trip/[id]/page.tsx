import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { LiveTripScreen } from '../../../../../components/trip/live-trip-screen';

export default async function TripPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <LiveTripScreen tripId={id} locale={locale} />;
}
