'use client';

import * as React from 'react';
import { Badge } from '@wasalni/ui';
import type { TripStatus } from '@wasalni/shared-types';
import type { Locale } from '@wasalni/i18n';

interface Props {
  status: TripStatus;
  locale: Locale;
}

const LABELS: Record<TripStatus, { ar: string; en: string }> = {
  pending: { ar: 'في الانتظار', en: 'Pending' },
  searching: { ar: 'بنبحث عن سائق…', en: 'Finding a driver…' },
  accepted: { ar: 'تم القبول', en: 'Accepted' },
  arriving: { ar: 'السائق في الطريق', en: 'Driver en route' },
  arrived: { ar: 'السائق وصل', en: 'Driver arrived' },
  in_progress: { ar: 'الرحلة جارية', en: 'On the trip' },
  completed: { ar: 'اكتملت', en: 'Completed' },
  cancelled: { ar: 'ملغية', en: 'Cancelled' },
};

const VARIANTS: Record<
  TripStatus,
  'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  pending: 'neutral',
  searching: 'info',
  accepted: 'brand',
  arriving: 'brand',
  arrived: 'success',
  in_progress: 'brand',
  completed: 'success',
  cancelled: 'danger',
};

export function TripStatusBadge({ status, locale }: Props): React.ReactElement {
  const label = LABELS[status][locale];
  return (
    <Badge
      variant={VARIANTS[status]}
      className="pointer-events-auto rounded-full bg-white/95 px-3 py-1.5 text-xs shadow-[var(--shadow-card)]"
    >
      {label}
    </Badge>
  );
}
