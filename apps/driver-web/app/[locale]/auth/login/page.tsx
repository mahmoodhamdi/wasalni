import * as React from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@wasalni/i18n';
import { LoginForm } from './login-form';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ next?: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{t('welcome')}</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t('enterPhone')}</p>
      </header>
      <LoginForm locale={locale} nextPath={next ?? `/${locale}`} />
      <p className="text-center text-xs text-[var(--color-fg-muted)]">{t('termsAgreement')}</p>
    </div>
  );
}
