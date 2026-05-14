import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { TripShareScreen } from '../../../../../components/trip/trip-share-screen';

export default async function TripSharePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TripShareScreen tripId={id} locale={locale} />;
}
