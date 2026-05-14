'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@wasalni/ui';

/**
 * Three-way theme toggle: system → light → dark → system …
 * Uses `next-themes` and renders only after mount to avoid hydration mismatch.
 */
export function ThemeToggle(): React.ReactElement | null {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
  const label = theme === 'system' ? t('system') : theme === 'light' ? t('light') : t('dark');
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`${t('toggle')} — ${label}`}
      title={`${t('toggle')} — ${label}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
