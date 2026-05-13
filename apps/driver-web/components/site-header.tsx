import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Car } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { UserMenu } from './user-menu';

export function SiteHeader(): React.ReactElement {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/70"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-brand-700)] text-white"
          >
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {t('app.brand')} <span className="text-[var(--color-fg-muted)]">·</span>{' '}
            <span className="text-sm font-normal text-[var(--color-fg-muted)]">
              {locale === 'ar' ? 'للسواق' : 'Driver'}
            </span>
          </span>
        </Link>
        <nav aria-label="utility" className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
