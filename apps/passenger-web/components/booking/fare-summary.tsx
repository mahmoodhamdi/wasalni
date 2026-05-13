'use client';

import * as React from 'react';
import { Clock, Route, TrendingUp } from 'lucide-react';
import type { Locale } from '@wasalni/i18n';

interface Props {
  total: number;
  formatted: string;
  distance: string;
  duration: string;
  surge: number;
  locale: Locale;
}

export function FareSummary({
  formatted,
  distance,
  duration,
  surge,
  locale,
}: Props): React.ReactElement {
  const ar = locale === 'ar';
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-[var(--color-fg-muted)]">
          <Route className="h-4 w-4" aria-hidden="true" />
          {distance}
        </span>
        <span className="flex items-center gap-1 text-[var(--color-fg-muted)]">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {duration}
        </span>
        {surge > 1 ? (
          <span className="flex items-center gap-1 text-[var(--color-warning-500)]">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />×{surge.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="text-end">
        <p className="text-xs text-[var(--color-fg-muted)]">{ar ? 'الإجمالي' : 'Total'}</p>
        <p className="text-base font-bold text-[var(--color-fg)]">{formatted}</p>
      </div>
    </div>
  );
}
