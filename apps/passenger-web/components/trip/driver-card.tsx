'use client';

import * as React from 'react';
import { Star, Phone } from 'lucide-react';
import type { Locale } from '@wasalni/i18n';
import type { IDriver } from '@wasalni/shared-types';

interface Props {
  driver: IDriver | null;
  locale: Locale;
}

export function DriverCard({ driver, locale }: Props): React.ReactElement {
  const ar = locale === 'ar';

  if (!driver) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm text-[var(--color-fg-muted)]">
          {ar ? 'بنبحث لك عن سائق…' : 'Looking for a driver…'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-lg font-bold text-[var(--color-brand-700)]">
          {driver.name.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-[var(--color-fg)]">{driver.name}</p>
          <p className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
            <Star
              className="h-3 w-3 fill-current text-[var(--color-warning-500)]"
              aria-hidden="true"
            />
            {driver.rating?.toFixed(1) ?? '—'}
            <span aria-hidden="true">·</span>
            <span>
              {driver.vehicle.make} {driver.vehicle.model}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]" dir="ltr">
            {driver.vehicle.plateNumber} · {driver.vehicle.color}
          </p>
        </div>
        {driver.phone ? (
          <a
            href={`tel:${driver.phone}`}
            aria-label={ar ? 'اتصال' : 'Call'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-500)] text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
