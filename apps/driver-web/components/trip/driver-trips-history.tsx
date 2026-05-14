'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Badge, Card, CardContent, EmptyState, RatingStars, Spinner } from '@wasalni/ui';
import { useAuth } from '@wasalni/auth/react';
import { formatMoney } from '@wasalni/utils/currency';
import { formatRelative } from '@wasalni/utils/date';
import type { Locale } from '@wasalni/i18n';
import type { ITrip, TripStatus } from '@wasalni/shared-types';

interface Props {
  locale: Locale;
}

interface TripPage {
  items: ITrip[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

const STATUS_LABELS: Record<TripStatus, { ar: string; en: string }> = {
  pending: { ar: 'في الانتظار', en: 'Pending' },
  searching: { ar: 'البحث', en: 'Searching' },
  accepted: { ar: 'مقبولة', en: 'Accepted' },
  arriving: { ar: 'قاربت', en: 'Arriving' },
  arrived: { ar: 'وصلت', en: 'Arrived' },
  in_progress: { ar: 'جارية', en: 'In progress' },
  completed: { ar: 'مكتملة', en: 'Completed' },
  cancelled: { ar: 'ملغية', en: 'Cancelled' },
};

const STATUS_VARIANT: Record<TripStatus, 'success' | 'danger' | 'info' | 'warning' | 'neutral'> = {
  pending: 'neutral',
  searching: 'info',
  accepted: 'info',
  arriving: 'info',
  arrived: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export function DriverTripsHistory({ locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const ar = locale === 'ar';

  const { data, isPending } = useQuery<TripPage>({
    queryKey: ['driver-trips'],
    queryFn: async () => {
      const res = await fetcher('/api/trips?page=1&limit=20', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: TripPage };
      return body.data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl py-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ar ? 'رحلاتي' : 'My trips'}</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {ar ? 'كل رحلات اليوم والشهر' : 'Every trip from this month'}
          </p>
        </div>
        {data ? (
          <div className="text-end">
            <p className="text-xs text-[var(--color-fg-muted)]">
              {ar ? 'إجمالي الرحلات' : 'Total trips'}
            </p>
            <p className="text-xl font-bold">{data.total}</p>
          </div>
        ) : null}
      </header>

      {isPending ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status">
          <Spinner size="lg" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
          title={ar ? 'لسه ما عملت رحلة' : 'No trips yet'}
          description={
            ar ? 'ابدأ الاستقبال علشان توصلك أول رحلة' : 'Go online to receive your first trip'
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.items.map((trip) => (
            <li key={trip._id}>
              <Link
                href={`/${locale}/trip/${trip._id}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
              >
                <Card className="hover:bg-[var(--color-bg-subtle)]">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={STATUS_VARIANT[trip.status]}>
                        {STATUS_LABELS[trip.status][locale]}
                      </Badge>
                      <span className="text-xs text-[var(--color-fg-muted)]">
                        {formatRelative(trip.createdAt, ar ? 'ar-EG' : 'en-EG')}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium">{trip.pickup.address}</p>
                    <p className="truncate text-sm text-[var(--color-fg-muted)]">
                      → {trip.dropoff.address}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--color-success-500)]">
                        +{formatMoney(trip.fare.driverEarnings)}
                      </span>
                      {trip.driverRating ? (
                        <RatingStars value={trip.driverRating.score} size="sm" readOnly />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
