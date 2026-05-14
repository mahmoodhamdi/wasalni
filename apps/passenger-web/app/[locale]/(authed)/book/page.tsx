import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { BookingScreen } from '../../../../components/booking/booking-screen';

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingScreen locale={locale} />;
}
