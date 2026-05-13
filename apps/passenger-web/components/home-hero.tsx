'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';

/**
 * Hero card on the landing page. Adapts copy when the user is authenticated:
 *  - signed out: full hero with CTA → /auth/login
 *  - signed in: short "welcome back" + go-to-booking CTA
 *  - hydrating: skeleton-equivalent placeholder
 */
export function HomeHero(): React.ReactElement {
  const t = useTranslations('home');
  const { user, isAuthenticated, isHydrated } = useAuth();
  const locale = useLocale();

  const heroBase =
    'rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-bg-subtle)] p-8 sm:p-12 text-center';

  if (!isHydrated) {
    return (
      <section aria-labelledby="hero-heading" className={heroBase}>
        <div className="mx-auto h-8 w-32 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        <div className="mx-auto mt-4 h-10 w-2/3 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        <div className="mx-auto mt-3 h-5 w-1/2 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        <div className="mx-auto mt-8 h-12 w-40 animate-pulse rounded-md bg-[var(--color-bg-muted)]" />
      </section>
    );
  }

  if (isAuthenticated && user) {
    return (
      <section aria-labelledby="hero-heading" className={heroBase}>
        <Badge variant="success" className="mb-4">
          {t('demoUserBadge')}
        </Badge>
        <h1 id="hero-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t('loggedInHello', { name: user.name })}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-[var(--color-fg-muted)]">
          {t('loggedInSubtitle')}
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            href={`/${locale}/book`}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-brand-600)] px-6 text-base font-medium text-white hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
          >
            {t('cta')}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hero-heading" className={heroBase}>
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
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-brand-600)] px-6 text-base font-medium text-white hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
        >
          {t('cta')}
          <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
