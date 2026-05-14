'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Locale } from '@wasalni/i18n';
import { formatMoney } from '@wasalni/utils/currency';

interface Props {
  locale: Locale;
  fetcher: typeof fetch;
}

interface Summary {
  today: number;
  week: number;
  pendingPayout: number;
  totalTrips: number;
}

export function EarningsCard({ locale, fetcher }: Props): React.ReactElement {
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetcher('/api/driver/earnings/summary', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: Summary } | null) => {
        if (!cancelled && body?.data) setSummary(body.data);
      })
      .catch(() => {
        // ignored — endpoint will be wired in PR 12
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  const ar = locale === 'ar';

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-fg-muted)]">
            {ar ? 'أرباحك النهاردة' : 'Earnings today'}
          </p>
          {loading ? (
            <div className="mt-1 h-7 w-24 animate-pulse rounded bg-[var(--color-bg-muted)]" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-[var(--color-fg)]">
              {formatMoney(summary?.today ?? 0)}
            </p>
          )}
        </div>
        <div className="text-end">
          <p className="text-xs text-[var(--color-fg-muted)]">{ar ? 'الرحلات' : 'Trips'}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-fg)]">
            {loading ? '—' : (summary?.totalTrips ?? 0)}
          </p>
        </div>
      </div>
      {!loading && summary ? (
        <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {ar ? 'هذا الأسبوع:' : 'This week:'} {formatMoney(summary.week)}
          </span>
          {summary.pendingPayout > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {ar ? 'للسحب:' : 'To withdraw:'} {formatMoney(summary.pendingPayout)}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
