'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Phone, MessageCircle, MapPin, Navigation } from 'lucide-react';
import { WasalniMap, PinMarker, RouteLayer, useGeolocation, type RouteCoord } from '@wasalni/map';
import { useAuth } from '@wasalni/auth/react';
import { useSocket, useTripRoom } from '@wasalni/socket-client/react';
import { Spinner, ChatPanel, type ChatPanelMessage } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';
import type { ITrip, IPassenger, TripStatus } from '@wasalni/shared-types';

interface Props {
  tripId: string;
  locale: Locale;
}

const NEXT_STATUS: Partial<
  Record<TripStatus, { endpoint: string; nextLabel: { ar: string; en: string } }>
> = {
  accepted: {
    endpoint: 'arrived',
    nextLabel: { ar: 'وصلت لنقطة الانطلاق', en: 'Arrived at pickup' },
  },
  arriving: {
    endpoint: 'arrived',
    nextLabel: { ar: 'وصلت لنقطة الانطلاق', en: 'Arrived at pickup' },
  },
  arrived: { endpoint: 'start', nextLabel: { ar: 'ابدأ الرحلة', en: 'Start trip' } },
  in_progress: { endpoint: 'complete', nextLabel: { ar: 'إنهاء الرحلة', en: 'Complete trip' } },
};

export function DriverActiveTrip({ tripId, locale }: Props): React.ReactElement {
  const router = useRouter();
  const { user, fetcher } = useAuth();
  const { socket } = useSocket();
  const room = useTripRoom(tripId);
  const geo = useGeolocation({ watch: true, enableHighAccuracy: true });
  const [advancing, setAdvancing] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);

  const { data: trip } = useQuery<ITrip>({
    queryKey: ['driver-trip', tripId],
    queryFn: async () => {
      const res = await fetcher(`/api/trips/${tripId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('trip-not-found');
      const body = (await res.json()) as { data: ITrip };
      return body.data;
    },
    refetchInterval: room.connected ? false : 5_000,
  });

  // Stream driver location to the trip room.
  React.useEffect(() => {
    if (!socket || !geo.coords || !user) return;
    socket.emit('driver:location', {
      driverId: user._id,
      latitude: geo.coords.latitude,
      longitude: geo.coords.longitude,
      heading: geo.heading ?? undefined,
      speed: geo.speed ?? undefined,
    });
  }, [
    socket,
    geo.coords?.latitude,
    geo.coords?.longitude,
    geo.heading,
    geo.speed,
    user,
    geo.coords,
  ]);

  const status: TripStatus = room.status ?? trip?.status ?? 'pending';
  const ar = locale === 'ar';

  React.useEffect(() => {
    if (status === 'completed') {
      window.location.replace(`/${locale}/trip/${tripId}/complete`);
    } else if (status === 'cancelled') {
      toast(ar ? 'الرحلة اتلغت' : 'Trip cancelled');
      router.replace(`/${locale}/home`);
    }
  }, [status, locale, tripId, ar, router]);

  const advance = async () => {
    const transition = NEXT_STATUS[status];
    if (!transition || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetcher(`/api/trips/${tripId}/${transition.endpoint}`, { method: 'POST' });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(b?.error ?? (ar ? 'تعذّر التحديث' : 'Could not update'));
      }
    } finally {
      setAdvancing(false);
    }
  };

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="lg" />
      </div>
    );
  }

  const passenger = typeof trip.passenger === 'object' ? (trip.passenger as IPassenger) : null;

  // Show navigation to pickup until arrived; then route to dropoff during trip.
  const navTarget =
    status === 'in_progress'
      ? { lat: trip.dropoff.latitude, lng: trip.dropoff.longitude }
      : { lat: trip.pickup.latitude, lng: trip.pickup.longitude };
  const route: RouteCoord[] = geo.coords
    ? [
        { latitude: geo.coords.latitude, longitude: geo.coords.longitude },
        { latitude: navTarget.lat, longitude: navTarget.lng },
      ]
    : [];

  const messages: ChatPanelMessage[] = room.messages.map((m) => ({
    id: m.id,
    from: m.from === 'system' ? 'system' : m.from === 'driver' ? 'self' : 'other',
    text: m.text,
    at: m.at,
  }));

  const transition = NEXT_STATUS[status];

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 relative h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0">
        <WasalniMap
          initialView={
            geo.coords
              ? { longitude: geo.coords.longitude, latitude: geo.coords.latitude, zoom: 14 }
              : {
                  longitude: trip.pickup.longitude,
                  latitude: trip.pickup.latitude,
                  zoom: 14,
                }
          }
          aria-label={ar ? 'خريطة الرحلة' : 'Trip map'}
        >
          {geo.coords ? (
            <PinMarker
              longitude={geo.coords.longitude}
              latitude={geo.coords.latitude}
              variant="driver"
              bearing={geo.heading ?? undefined}
            />
          ) : null}
          <PinMarker
            longitude={trip.pickup.longitude}
            latitude={trip.pickup.latitude}
            variant="pickup"
          />
          <PinMarker
            longitude={trip.dropoff.longitude}
            latitude={trip.dropoff.latitude}
            variant="dropoff"
          />
          {route.length === 2 ? <RouteLayer coordinates={route} /> : null}
        </WasalniMap>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 sm:p-4">
        {passenger ? (
          <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-800)] font-bold">
                {passenger.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">{passenger.name}</p>
                <p className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate">
                    {status === 'in_progress' ? trip.dropoff.address : trip.pickup.address}
                  </span>
                </p>
              </div>
              <a
                href={passenger.phone ? `tel:${passenger.phone}` : undefined}
                aria-label={ar ? 'اتصال' : 'Call'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-500)] text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setChatOpen((o) => !o)}
                aria-label={ar ? 'محادثة' : 'Chat'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-600)] text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {chatOpen ? (
          <div className="pointer-events-auto mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-elevated)]">
              <ChatPanel
                messages={messages}
                onSend={room.sendMessage}
                disabled={!room.connected}
                placeholder={ar ? 'اكتب رسالة' : 'Type a message'}
                sendLabel={ar ? 'إرسال' : 'Send'}
                emptyHint={ar ? 'تواصل مع الراكب لو محتاج' : 'Message the rider'}
                className="h-64"
                locale={ar ? 'ar-EG' : 'en-EG'}
              />
            </div>
          </div>
        ) : null}

        {transition ? (
          <div className="pointer-events-auto mx-auto w-full max-w-md">
            <button
              type="button"
              disabled={advancing}
              onClick={advance}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-600)] text-base font-semibold text-white hover:bg-[var(--color-brand-700)] disabled:opacity-50"
              aria-busy={advancing || undefined}
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
              {transition.nextLabel[locale]}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
