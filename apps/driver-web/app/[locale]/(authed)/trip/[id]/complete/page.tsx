import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { DriverTripCompleteScreen } from '../../../../../../components/rating/driver-trip-complete-screen';

export default async function DriverTripCompletePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DriverTripCompleteScreen tripId={id} locale={locale} />;
}
