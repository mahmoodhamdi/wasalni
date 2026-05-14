import * as React from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Locale } from '@wasalni/i18n';
import { DriverRegisterForm } from './register-form';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ phone?: string; otp?: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const { phone, otp } = await searchParams;
  if (!phone || !otp) redirect(`/${locale}/auth/login`);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          {locale === 'ar' ? 'سجل كسائق وصلني' : 'Register as a Wasalni driver'}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          {locale === 'ar'
            ? 'محتاجين بعض المعلومات علشان نوافق على حسابك. تستلم رد خلال 24 ساعة.'
            : "We need a few details to approve your account. You'll hear back within 24 hours."}
        </p>
      </header>
      <DriverRegisterForm locale={locale} phone={phone} otp={otp} brand={t('app.brand')} />
    </div>
  );
}
