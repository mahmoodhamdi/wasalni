'use client';

import * as React from 'react';
import { Power, Sun } from 'lucide-react';
import type { Locale } from '@wasalni/i18n';

interface Props {
  status: 'online' | 'offline' | 'busy';
  disabled?: boolean;
  onToggle: (next: 'online' | 'offline') => void;
  locale: Locale;
  wakeLockSupported: boolean;
  wakeLockHeld: boolean;
}

export function OnlineToggle({
  status,
  disabled,
  onToggle,
  locale,
  wakeLockSupported,
  wakeLockHeld,
}: Props): React.ReactElement {
  const ar = locale === 'ar';
  const online = status === 'online' || status === 'busy';

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-[var(--shadow-elevated)]">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={online}
        onClick={() => onToggle(online ? 'offline' : 'online')}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          online
            ? 'bg-[var(--color-danger-500)] text-white hover:opacity-90'
            : 'bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)]'
        }`}
      >
        <Power className="h-5 w-5" aria-hidden="true" />
        <span>
          {online ? (ar ? 'أوقف الاستقبال' : 'Go offline') : ar ? 'ابدأ الاستقبال' : 'Go online'}
        </span>
      </button>
      {online && wakeLockSupported ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
          <Sun
            className={`h-3.5 w-3.5 ${wakeLockHeld ? 'text-[var(--color-success-500)]' : ''}`}
            aria-hidden="true"
          />
          {wakeLockHeld
            ? ar
              ? 'الشاشة هتفضل مفتوحة'
              : 'Screen will stay on'
            : ar
              ? 'الشاشة ممكن تطفي'
              : 'Screen may sleep'}
        </p>
      ) : null}
    </div>
  );
}
