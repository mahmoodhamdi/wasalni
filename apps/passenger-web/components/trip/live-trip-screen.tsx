'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, X, AlertOctagon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { WasalniMap, PinMarker, RouteLayer, type RouteCoord } from '@wasalni/map';
import { useTripRoom } from '@wasalni/socket-client/react';
import { useAuth } from '@wasalni/auth/react';
import { ChatPanel, type ChatPanelMessage, Spinner } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';
import type { ITrip, IDriver, TripStatus } from '@wasalni/shared-types';
import { TripStatusBadge } from './trip-status-badge';
import { DriverCard } from './driver-card';

interface Props {
  tripId: string;
  locale: Locale;
}

/**
 * Passenger-side live trip experience.
 *   - Polls `/api/trips/[id]` for the source of truth (initial fetch +
 *     refetch on socket disconnect).
 *   - Subscribes via Socket.io for live status + driver location + chat.
 *   - When status hits 'completed' or 'cancelled', navigates to the
 *     corresponding screen (PR 11).
 */
export function LiveTripScreen({ tripId, locale }: Props): React.ReactElement {
  const { user, fetcher } = useAuth();
  const room = useTripRoom(tripId);
  const [chatOpen, setChatOpen] = React.useState(false);

  const { data: trip } = useQuery<ITrip>({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await fetcher(`/api/trips/${tripId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('trip-not-found');
      const body = (await res.json()) as { data: ITrip };
      return body.data;
    },
    refetchInterval: room.connected ? false : 5_000,
  });

  const status: TripStatus = room.status ?? trip?.status ?? 'pending';
  const ar = locale === 'ar';

  React.useEffect(() => {
    if (status === 'completed') {
      window.location.replace(`/${locale}/trip/${tripId}/complete`);
    } else if (status === 'cancelled') {
      toast(ar ? 'الرحلة اتلغت' : 'Trip cancelled');
      window.location.replace(`/${locale}`);
    }
  }, [status, locale, tripId, ar]);

  const handleCancel = async () => {
    if (!window.confirm(ar ? 'متأكد إنك عاوز تلغي الرحلة؟' : 'Cancel this trip?')) return;
    const res = await fetcher('/api/trips/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tripId, reason: 'passenger_cancelled' }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(b?.error ?? (ar ? 'تعذّر الإلغاء' : 'Could not cancel'));
    }
  };

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="lg" />
      </div>
    );
  }

  const driver = typeof trip.driver === 'object' ? (trip.driver as IDriver) : null;

  const driverCoords = room.driverLocation ?? (driver?.location ? driver.location : null);

  const route: RouteCoord[] = [
    { latitude: trip.pickup.latitude, longitude: trip.pickup.longitude },
    { latitude: trip.dropoff.latitude, longitude: trip.dropoff.longitude },
  ];

  const messages: ChatPanelMessage[] = room.messages.map((m) => ({
    id: m.id,
    from: m.from === 'system' ? 'system' : m.from === 'passenger' ? 'self' : 'other',
    text: m.text,
    at: m.at,
  }));

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 relative h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0">
        <WasalniMap
          initialView={{
            longitude: trip.pickup.longitude,
            latitude: trip.pickup.latitude,
            zoom: 14,
          }}
          aria-label={ar ? 'خريطة الرحلة' : 'Trip map'}
        >
          <PinMarker
            longitude={trip.pickup.longitude}
            latitude={trip.pickup.latitude}
            variant="pickup"
            label={ar ? 'الانطلاق' : 'Pickup'}
          />
          <PinMarker
            longitude={trip.dropoff.longitude}
            latitude={trip.dropoff.latitude}
            variant="dropoff"
            label={ar ? 'الوجهة' : 'Dropoff'}
          />
          {driverCoords ? (
            <PinMarker
              longitude={driverCoords.longitude}
              latitude={driverCoords.latitude}
              variant="driver"
              bearing={room.driverLocation?.heading ?? undefined}
            />
          ) : null}
          <RouteLayer coordinates={route} />
        </WasalniMap>
      </div>

      <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-2">
        <TripStatusBadge status={status} locale={locale} />
        <button
          type="button"
          onClick={handleCancel}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-[var(--color-danger-500)] shadow-[var(--shadow-card)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {ar ? 'إلغاء' : 'Cancel'}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <DriverCard driver={driver} locale={locale} />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={() => setChatOpen((o) => !o)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-medium text-[var(--color-fg)] shadow-[var(--shadow-card)] hover:bg-[var(--color-bg-subtle)]"
            aria-expanded={chatOpen}
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {chatOpen ? (ar ? 'إغلاق المحادثة' : 'Close chat') : ar ? 'المحادثة' : 'Chat'}
            {messages.length > 0 && !chatOpen ? (
              <span className="ms-1 rounded-full bg-[var(--color-brand-600)] px-1.5 py-0.5 text-[10px] text-white">
                {messages.length}
              </span>
            ) : null}
          </button>
        </div>
        {chatOpen ? (
          <div className="pointer-events-auto mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-elevated)]">
              <ChatPanel
                messages={messages}
                onSend={room.sendMessage}
                disabled={!room.connected}
                placeholder={ar ? 'اكتب رسالة' : 'Type a message'}
                sendLabel={ar ? 'إرسال' : 'Send'}
                emptyHint={ar ? 'ابدأ المحادثة مع السائق' : 'Say hi to your driver'}
                className="h-72"
                locale={ar ? 'ar-EG' : 'en-EG'}
              />
            </div>
          </div>
        ) : null}
        {!room.connected ? (
          <div className="pointer-events-auto mx-auto w-full max-w-md rounded-lg border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-xs">
            <p className="flex items-center gap-2">
              <AlertOctagon className="h-3.5 w-3.5 text-[var(--color-warning-500)]" />
              {ar ? 'الاتصال انقطع — بنحاول نرجعه' : 'Connection lost — reconnecting'}
              {user ? null : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
