import * as React from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Locale } from '@wasalni/i18n';
import { RegisterForm } from './register-form';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ phone?: string; otp?: string; next?: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const { phone, otp, next } = await searchParams;
  if (!phone || !otp) redirect(`/${locale}/auth/login`);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">
          {t('app.brand')} — {locale === 'ar' ? 'حساب جديد' : 'New account'}
        </h1>
      </header>
      <RegisterForm locale={locale} phone={phone} otp={otp} nextPath={next ?? `/${locale}`} />
    </div>
  );
}
