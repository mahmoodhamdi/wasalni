import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { TripCompleteScreen } from '../../../../../../components/rating/trip-complete-screen';

export default async function TripCompletePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TripCompleteScreen tripId={id} locale={locale} />;
}
