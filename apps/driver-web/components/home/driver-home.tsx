'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { Power } from 'lucide-react';
import { WasalniMap, PinMarker, useGeolocation } from '@wasalni/map';
import { useAuth } from '@wasalni/auth/react';
import { useWakeLock } from '@wasalni/pwa';
import type { Locale } from '@wasalni/i18n';
import { OnlineToggle } from './online-toggle';
import { EarningsCard } from './earnings-card';

interface DriverHomeProps {
  locale: Locale;
}

type Status = 'online' | 'offline' | 'busy';

/**
 * Driver dashboard. Top-half map shows current location with a heading
 * pin; bottom sheet has the online/offline toggle, an earnings preview,
 * and (in PR 10) the incoming-ride request modal.
 *
 * When the driver goes online:
 *  - Acquires Screen Wake Lock (best-effort)
 *  - Starts emitting `driver:location` over Socket.io (wired in PR 10)
 */
export function DriverHome({ locale }: DriverHomeProps): React.ReactElement {
  const { fetcher } = useAuth();
  const wakeLock = useWakeLock();
  const geo = useGeolocation({ watch: true, enableHighAccuracy: true });

  const [status, setStatus] = React.useState<Status>('offline');
  const [toggling, setToggling] = React.useState(false);

  const setRemoteStatus = React.useCallback(
    async (next: Status) => {
      setToggling(true);
      try {
        const res = await fetcher('/api/driver/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => null)) as { error?: string } | null;
          toast.error(
            b?.error ?? (locale === 'ar' ? 'تعذّر تغيير الحالة' : 'Could not change status'),
          );
          return;
        }
        setStatus(next);
        if (next === 'online') {
          await wakeLock.request();
        } else {
          await wakeLock.release();
        }
      } catch {
        toast.error(locale === 'ar' ? 'مشكلة في الشبكة' : 'Network error');
      } finally {
        setToggling(false);
      }
    },
    [fetcher, wakeLock, locale],
  );

  const ar = locale === 'ar';

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 relative h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0">
        <WasalniMap
          initialView={
            geo.coords
              ? { longitude: geo.coords.longitude, latitude: geo.coords.latitude, zoom: 14 }
              : undefined
          }
          aria-label={ar ? 'خريطة السائق' : 'Driver map'}
        >
          {geo.coords ? (
            <PinMarker
              longitude={geo.coords.longitude}
              latitude={geo.coords.latitude}
              variant="driver"
              bearing={geo.heading ?? undefined}
            />
          ) : null}
        </WasalniMap>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <EarningsCard locale={locale} fetcher={fetcher} />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <OnlineToggle
            status={status}
            disabled={toggling}
            onToggle={(next) => setRemoteStatus(next)}
            locale={locale}
            wakeLockSupported={wakeLock.isSupported}
            wakeLockHeld={wakeLock.isHeld}
          />
        </div>
      </div>

      {!geo.hasFix ? (
        <div className="pointer-events-auto absolute inset-x-2 top-2 z-10 mx-auto max-w-md rounded-lg border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-sm">
          <p className="flex items-center gap-2 text-[var(--color-fg)]">
            <Power className="h-4 w-4 text-[var(--color-warning-500)]" aria-hidden="true" />
            {ar ? 'فعّل خدمة الموقع علشان تشتغل' : 'Enable location services to go online'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
