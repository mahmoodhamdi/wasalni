import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

export function SiteHeader(): React.ReactElement {
  const t = useTranslations();
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/70"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-brand-600)] font-bold text-white"
          >
            و
          </span>
          <span className="text-lg font-semibold tracking-tight">{t('app.brand')}</span>
        </div>
        <nav aria-label="utility" className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
