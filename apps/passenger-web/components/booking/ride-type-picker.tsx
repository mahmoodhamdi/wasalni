'use client';

import * as React from 'react';
import { Car, Truck, Bike, Zap } from 'lucide-react';
import type { VehicleType } from '@wasalni/schemas';
import type { Locale } from '@wasalni/i18n';
import { formatMoney } from '@wasalni/utils/currency';

interface RideOption {
  rideType: VehicleType;
  estimate: {
    breakdown: { total: number };
    duration: number;
  };
}

interface Props {
  value: VehicleType;
  onChange: (v: VehicleType) => void;
  options: RideOption[];
  loading: boolean;
  locale: Locale;
}

const ICONS: Record<VehicleType, React.ElementType> = {
  economy: Car,
  comfort: Car,
  family: Truck,
  tuktuk: Zap,
  motorcycle: Bike,
};

const LABELS: Record<VehicleType, { ar: string; en: string }> = {
  economy: { ar: 'اقتصادي', en: 'Economy' },
  comfort: { ar: 'مريح', en: 'Comfort' },
  family: { ar: 'عائلي', en: 'Family' },
  tuktuk: { ar: 'توك توك', en: 'Tuk-tuk' },
  motorcycle: { ar: 'موتوسيكل', en: 'Motorcycle' },
};

const ORDER: VehicleType[] = ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'];

export function RideTypePicker({
  value,
  onChange,
  options,
  loading,
  locale,
}: Props): React.ReactElement {
  const byType = new Map(options.map((o) => [o.rideType, o]));

  return (
    <div
      className="mt-3"
      role="radiogroup"
      aria-label={locale === 'ar' ? 'نوع الرحلة' : 'Ride type'}
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ORDER.map((t) => {
          const opt = byType.get(t);
          const Icon = ICONS[t];
          const label = LABELS[t][locale];
          const checked = value === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(t)}
              className={`flex min-w-[6.5rem] flex-shrink-0 flex-col items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 ${
                checked
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-800)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">{label}</span>
              {opt ? (
                <span className="text-xs text-[var(--color-fg-muted)]">
                  {formatMoney(opt.estimate.breakdown.total)}
                </span>
              ) : loading ? (
                <span className="text-xs text-[var(--color-fg-muted)]">…</span>
              ) : (
                <span className="text-xs text-[var(--color-fg-muted)]">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
