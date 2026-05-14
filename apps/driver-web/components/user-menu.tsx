'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';

export function UserMenu(): React.ReactElement | null {
  const { user, isAuthenticated, isHydrated, logout } = useAuth();
  const t = useTranslations('nav');
  const locale = useLocale();
  const [loggingOut, setLoggingOut] = React.useState(false);

  if (!isHydrated) {
    return <div aria-hidden="true" className="h-8 w-20" />;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/${locale}/auth/login`}
        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-brand-600)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        <span>{t('login')}</span>
      </Link>
    );
  }

  const name = user?.name ?? '';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[var(--color-bg-muted)] px-2.5 py-1 text-sm">
        <User className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" aria-hidden="true" />
        <span className="max-w-[140px] truncate font-medium">{name}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        isLoading={loggingOut}
        aria-label={t('logout')}
        title={t('logout')}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
