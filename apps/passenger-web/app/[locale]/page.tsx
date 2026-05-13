import * as React from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, MapPin, Wallet, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@wasalni/ui';
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
        className="rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-bg-subtle)] p-8 sm:p-12 text-center"
      >
        <Badge variant="brand" className="mb-4">
          {t('demoUserBadge')}
        </Badge>
        <h1 id="hero-heading" className="text-3xl font-bold tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--color-fg-muted)] sm:text-lg">
          {t('subtitle')}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="primary" aria-label={t('cta')}>
            {t('cta')}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="features-heading"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <FeatureCard
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          title={t('feature1Title')}
          body={t('feature1Body')}
        />
        <FeatureCard
          icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
          title={t('feature2Title')}
          body={t('feature2Body')}
        />
        <FeatureCard
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          title={t('feature3Title')}
          body={t('feature3Body')}
        />
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
