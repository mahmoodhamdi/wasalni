import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getDirection, type Locale } from '@wasalni/i18n';
import { routing } from '../../i18n/routing';
import { AppProviders } from '../../providers/app-providers';
import { SiteHeader } from '../../components/site-header';
import '../globals.css';

export function generateStaticParams(): Array<{ locale: Locale }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  const driver = locale === 'ar' ? 'للسواق' : 'Driver';
  return {
    title: { default: `${t('brand')} ${driver}`, template: `%s · ${t('brand')} ${driver}` },
    description: t('tagline'),
    applicationName: `${t('brand')} ${driver}`,
    formatDetection: { telephone: false, address: false, email: false },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a242b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = getDirection(locale as Locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:bg-[var(--color-brand-600)] focus:px-3 focus:py-1.5 focus:text-white"
            />
            <SiteHeader />
            <main id="main" className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
              {children}
            </main>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
