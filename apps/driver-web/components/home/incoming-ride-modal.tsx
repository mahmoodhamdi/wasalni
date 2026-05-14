'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '@wasalni/socket-client/react';
import { useAuth } from '@wasalni/auth/react';
import { formatMoney } from '@wasalni/utils/currency';
import { formatDistance } from '@wasalni/utils/distance';
import type { Locale } from '@wasalni/i18n';
import type { IncomingRideRequest } from '@wasalni/socket-client';

interface Props {
  request: IncomingRideRequest;
  onClose: () => void;
  locale: Locale;
}

/**
 * Full-screen accept/decline modal. Times out automatically using the
 * `expiresIn` value provided by the backend.
 */
export function IncomingRideModal({ request, onClose, locale }: Props): React.ReactElement {
  const { socket } = useSocket();
  const { fetcher } = useAuth();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = React.useState(request.expiresIn);
  const ar = locale === 'ar';

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      onClose();
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, onClose]);

  const decline = () => {
    socket?.emit('trip:chat:send', { tripId: request.tripId, text: '[declined]' });
    onClose();
  };

  const accept = async () => {
    try {
      const res = await fetcher(`/api/trips/${request.tripId}/accept`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(b?.error ?? (ar ? 'تعذّر القبول' : 'Could not accept'));
        return;
      }
      onClose();
      router.push(`/${locale}/trip/${request.tripId}`);
    } catch {
      toast.error(ar ? 'مشكلة في الشبكة' : 'Network error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg)] p-5 shadow-[var(--shadow-overlay)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{ar ? 'طلب رحلة جديد' : 'New trip request'}</h2>
          <span
            className="rounded-full bg-[var(--color-danger-500)] px-2.5 py-1 text-sm font-bold text-white"
            aria-live="polite"
          >
            {secondsLeft}s
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-800)] font-bold">
              {request.passenger.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{request.passenger.name}</p>
              <p className="text-xs text-[var(--color-fg-muted)]">
                {request.passenger.rating
                  ? `★ ${request.passenger.rating.toFixed(1)}`
                  : ar
                    ? 'راكب جديد'
                    : 'New rider'}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-[var(--color-fg-muted)]">{ar ? 'المقدّر' : 'Est.'}</p>
              <p className="text-lg font-bold">{formatMoney(request.estimatedFare)}</p>
            </div>
          </div>
          <div className="space-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm">
            <p className="flex items-start gap-2">
              <MapPin
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-brand-600)]"
                aria-hidden="true"
              />
              <span className="line-clamp-2">{request.pickup.address}</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-danger-500)]"
                aria-hidden="true"
              />
              <span className="line-clamp-2">{request.dropoff.address}</span>
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              {formatDistance(request.estimatedDistance * 1000, ar ? 'ar-EG' : 'en-EG')} ·{' '}
              {request.estimatedDuration} {ar ? 'دقيقة' : 'min'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={decline}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-semibold text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            {ar ? 'تجاهل' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={accept}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] text-sm font-semibold text-white hover:bg-[var(--color-brand-700)]"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            {ar ? 'قبول' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
