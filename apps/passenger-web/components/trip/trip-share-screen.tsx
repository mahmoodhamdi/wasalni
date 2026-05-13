'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WasalniMap, PinMarker, RouteLayer } from '@wasalni/map';
import { Badge, Spinner, EmptyState } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';
import type { TripStatus } from '@wasalni/shared-types';

interface Props {
  tripId: string;
  locale: Locale;
}

interface SharedTrip {
  status: TripStatus;
  pickup: { latitude: number; longitude: number; address: string };
  dropoff: { latitude: number; longitude: number; address: string };
  driverLocation?: { latitude: number; longitude: number; heading?: number };
  passengerName?: string;
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

/**
 * Public-facing trip view: the passenger shares this URL with family/friends.
 * Polls every 10 s. No auth required. Backend serves a redacted projection
 * (no payment info, no passenger phone, etc.).
 */
export function TripShareScreen({ tripId, locale }: Props): React.ReactElement {
  const ar = locale === 'ar';

  const { data, isPending, isError } = useQuery<SharedTrip>({
    queryKey: ['shared-trip', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`);
      if (!res.ok) throw new Error('not-found');
      const body = (await res.json()) as { data: SharedTrip };
      return body.data;
    },
    refetchInterval: 10_000,
  });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="py-10">
        <EmptyState
          title={ar ? 'الرحلة غير متاحة' : 'Trip unavailable'}
          description={ar ? 'الرابط منتهي أو غير صحيح' : 'This link is invalid or expired'}
        />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 relative h-[calc(100vh-3.5rem)]">
      <div className="absolute inset-0">
        <WasalniMap
          initialView={{
            longitude: data.pickup.longitude,
            latitude: data.pickup.latitude,
            zoom: 14,
          }}
          aria-label={ar ? 'متابعة رحلة' : 'Tracking trip'}
        >
          <PinMarker
            longitude={data.pickup.longitude}
            latitude={data.pickup.latitude}
            variant="pickup"
            label={ar ? 'الانطلاق' : 'Pickup'}
          />
          <PinMarker
            longitude={data.dropoff.longitude}
            latitude={data.dropoff.latitude}
            variant="dropoff"
            label={ar ? 'الوجهة' : 'Dropoff'}
          />
          {data.driverLocation ? (
            <PinMarker
              longitude={data.driverLocation.longitude}
              latitude={data.driverLocation.latitude}
              variant="driver"
              bearing={data.driverLocation.heading}
            />
          ) : null}
          <RouteLayer
            coordinates={[
              { latitude: data.pickup.latitude, longitude: data.pickup.longitude },
              { latitude: data.dropoff.latitude, longitude: data.dropoff.longitude },
            ]}
          />
        </WasalniMap>
      </div>
      <div className="absolute inset-x-2 top-2 z-10 flex justify-center">
        <div className="rounded-full bg-white/95 px-4 py-1.5 shadow-[var(--shadow-card)]">
          <Badge variant="brand">
            {data.passengerName
              ? ar
                ? `بتتبع رحلة ${data.passengerName}`
                : `Tracking ${data.passengerName}'s trip`
              : ar
                ? 'متابعة الرحلة'
                : 'Tracking trip'}
          </Badge>
          <span className="ms-2 text-xs text-[var(--color-fg-muted)]">
            · {STATUS_LABELS[data.status][locale]}
          </span>
        </div>
      </div>
    </div>
  );
}
