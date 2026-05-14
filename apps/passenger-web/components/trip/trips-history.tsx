'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function TripsHistory({ locale }: Props): React.ReactElement {
  const { fetcher } = useAuth();
  const [page, setPage] = React.useState(1);
  const ar = locale === 'ar';

  const { data, isPending } = useQuery<TripPage>({
    queryKey: ['trips', page],
    queryFn: async () => {
      const res = await fetcher(`/api/trips?page=${page}&limit=10`, { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const body = (await res.json()) as { data: TripPage };
      return body.data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl py-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">{ar ? 'رحلاتي' : 'My trips'}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {ar ? 'كل رحلاتك السابقة' : "Every trip you've taken"}
        </p>
      </header>

      {isPending ? (
        <div className="flex min-h-[40vh] items-center justify-center" role="status">
          <Spinner size="lg" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
          title={ar ? 'لسه ما حجزت رحلة' : 'No trips yet'}
          description={ar ? 'لما تحجز أول رحلة هتلاقيها هنا' : 'Your trips will appear here'}
        />
      ) : (
        <>
          <ul className="space-y-2">
            {data.items.map((trip) => (
              <li key={trip._id}>
                <Link
                  href={`/${locale}/trip/${trip._id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
                >
                  <Card className="hover:bg-[var(--color-bg-subtle)]">
                    <CardContent className="flex items-start gap-3 py-3">
                      <div className="flex-1 min-w-0">
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
                          <span className="text-sm font-semibold">
                            {formatMoney(trip.fare.total)}
                          </span>
                          {trip.rating ? (
                            <RatingStars value={trip.rating.score} size="sm" readOnly />
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {data.hasNext || page > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                {ar ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-[var(--color-fg-muted)]">
                {ar ? `صفحة ${page}` : `Page ${page}`}
              </span>
              <button
                type="button"
                disabled={!data.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {ar ? 'التالي' : 'Next'}
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
