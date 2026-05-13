import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { WalletScreen } from '../../../../components/wallet/wallet-screen';

export default async function WalletPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WalletScreen locale={locale} />;
}
