import * as React from 'react';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Wallet, Sun, Users, AlertTriangle } from 'lucide-react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <div className="space-y-12">
      <section
        aria-labelledby="hero-heading"
        className="rounded-2xl bg-gradient-to-br from-[var(--color-brand-700)] to-[var(--color-brand-900)] p-8 sm:p-12 text-center text-white"
      >
        <Badge variant="brand" className="mb-4 bg-white text-[var(--color-brand-800)]">
          {t('demoUserBadge')}
        </Badge>
        <h1 id="hero-heading" className="text-3xl font-bold tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{t('subtitle')}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-base font-medium text-[var(--color-brand-800)] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-800)]"
          >
            {t('cta')}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-medium text-white hover:bg-white/10"
          >
            {t('loginCta')}
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="features-heading"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <h2 id="features-heading" className="sr-only">
          Driver value
        </h2>
        <FeatureCard
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          title={t('feature1Title')}
          body={t('feature1Body')}
        />
        <FeatureCard
          icon={<Sun className="h-5 w-5" aria-hidden="true" />}
          title={t('feature2Title')}
          body={t('feature2Body')}
        />
        <FeatureCard
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          title={t('feature3Title')}
          body={t('feature3Body')}
        />
      </section>

      <section
        aria-labelledby="caveat-heading"
        className="rounded-lg border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 p-5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-warning-500)]"
            aria-hidden="true"
          />
          <div>
            <h3 id="caveat-heading" className="font-semibold">
              {t('important')}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{t('wakeLockNote')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <span className="sr-only">{title}</span>
      </CardContent>
    </Card>
  );
}
