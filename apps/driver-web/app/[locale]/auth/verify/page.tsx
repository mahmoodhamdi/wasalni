import * as React from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Locale } from '@wasalni/i18n';
import { formatEgPhoneDisplay } from '@wasalni/utils/phone';
import { VerifyForm } from './verify-form';

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ phone?: string; next?: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const { phone, next } = await searchParams;
  if (!phone) redirect(`/${locale}/auth/login`);
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{t('enterOtp')}</h1>
        <p
          className="mt-2 text-sm text-[var(--color-fg-muted)]"
          dangerouslySetInnerHTML={{
            __html: t('otpSent', { phone: formatEgPhoneDisplay(phone) }),
          }}
        />
      </header>
      <VerifyForm locale={locale} phone={phone} nextPath={next ?? `/${locale}`} />
    </div>
  );
}
