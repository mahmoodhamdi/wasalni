'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import {
  WasalniMap,
  PinMarker,
  RouteLayer,
  useGeolocation,
  type PlaceResult,
  type RouteCoord,
} from '@wasalni/map';
import { useAuth } from '@wasalni/auth/react';
import type { Locale } from '@wasalni/i18n';
import type { PaymentMethod, VehicleType } from '@wasalni/schemas';
import { formatMoney } from '@wasalni/utils/currency';
import { formatDistance } from '@wasalni/utils/distance';
import { formatEta } from '@wasalni/utils/date';
import { RideTypePicker } from './ride-type-picker';
import { FareSummary } from './fare-summary';
import { LocationPicker } from './location-picker';
import { PromoInput, type AppliedPromo } from './promo-input';
import { PaymentMethodPicker } from './payment-method-picker';

interface FareOption {
  rideType: VehicleType;
  estimate: {
    breakdown: {
      total: number;
      discount: number;
      promoDiscount: number;
    };
    distance: number;
    duration: number;
    polyline?: string;
    surgeMultiplier: number;
  };
}

interface BookingScreenProps {
  locale: Locale;
}

/**
 * Full-screen booking flow:
 *  1. Pick pickup (defaults to user location)
 *  2. Pick dropoff
 *  3. Choose ride type (estimates fetched on dropoff change)
 *  4. Confirm — POST /api/trips, navigate to /trip/[id] (PR 10)
 *
 * Map fills the viewport; controls float above as a bottom sheet.
 */
export function BookingScreen({ locale }: BookingScreenProps): React.ReactElement {
  const tErrors = useTranslations('errors');
  const { fetcher } = useAuth();
  const geo = useGeolocation({ watch: false });

  const [pickup, setPickup] = React.useState<PlaceResult | null>(null);
  const [dropoff, setDropoff] = React.useState<PlaceResult | null>(null);
  const [rideType, setRideType] = React.useState<VehicleType>('economy');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash');
  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<AppliedPromo | null>(null);
  const [options, setOptions] = React.useState<FareOption[]>([]);
  const [route, setRoute] = React.useState<RouteCoord[]>([]);
  const [estimating, setEstimating] = React.useState(false);
  const [booking, setBooking] = React.useState(false);

  // Default pickup to the user's location once it resolves.
  React.useEffect(() => {
    if (!pickup && geo.coords) {
      setPickup({
        id: 'user-location',
        name: locale === 'ar' ? 'موقعي الحالي' : 'My location',
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
      });
    }
  }, [geo.coords, pickup, locale]);

  // Refetch fare estimate whenever pickup or dropoff change.
  React.useEffect(() => {
    if (!pickup || !dropoff) {
      setOptions([]);
      setRoute([]);
      return;
    }
    const controller = new AbortController();
    setEstimating(true);
    fetcher('/api/fare/estimate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        pickup: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          address: pickup.name,
        },
        dropoff: {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
          address: dropoff.name,
        },
        rideType,
        promoCode: appliedPromo?.code,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: { options: FareOption[]; polylinePoints?: RouteCoord[] } } | null) => {
        if (body?.data?.options) {
          setOptions(body.data.options);
          if (body.data.polylinePoints) {
            setRoute(body.data.polylinePoints);
          } else {
            // Fallback: straight line between pickup and dropoff.
            setRoute([
              { latitude: pickup.latitude, longitude: pickup.longitude },
              { latitude: dropoff.latitude, longitude: dropoff.longitude },
            ]);
          }
        } else {
          setOptions([]);
        }
      })
      .catch(() => {
        // ignored — likely aborted
      })
      .finally(() => setEstimating(false));
    return () => controller.abort();
  }, [pickup, dropoff, rideType, appliedPromo, fetcher]);

  const selectedOption = options.find((o) => o.rideType === rideType);

  const handleConfirm = async () => {
    if (!pickup || !dropoff || booking) return;
    setBooking(true);
    try {
      const res = await fetcher('/api/trips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pickup: {
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            address: pickup.name,
          },
          dropoff: {
            latitude: dropoff.latitude,
            longitude: dropoff.longitude,
            address: dropoff.name,
          },
          rideType,
          paymentMethod,
          promoCode: appliedPromo?.code,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? tErrors('generic'));
        return;
      }
      const body = (await res.json()) as { data: { _id: string } };
      window.location.href = `/${locale}/trip/${body.data._id}`;
    } catch {
      toast.error(tErrors('network'));
    } finally {
      setBooking(false);
    }
  };

  const ar = locale === 'ar';

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 relative h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="absolute inset-0">
        <WasalniMap
          initialView={
            geo.coords
              ? {
                  longitude: geo.coords.longitude,
                  latitude: geo.coords.latitude,
                  zoom: 14,
                }
              : undefined
          }
          aria-label={ar ? 'خريطة الحجز' : 'Booking map'}
        >
          {pickup ? (
            <PinMarker
              longitude={pickup.longitude}
              latitude={pickup.latitude}
              variant="pickup"
              label={ar ? 'نقطة الانطلاق' : 'Pickup'}
            />
          ) : null}
          {dropoff ? (
            <PinMarker
              longitude={dropoff.longitude}
              latitude={dropoff.latitude}
              variant="dropoff"
              label={ar ? 'الوجهة' : 'Dropoff'}
            />
          ) : null}
          {route.length >= 2 ? <RouteLayer coordinates={route} /> : null}
        </WasalniMap>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col">
        <div className="pointer-events-auto mx-auto w-full max-w-md rounded-t-2xl bg-[var(--color-bg)] p-4 shadow-[var(--shadow-overlay)] sm:m-4 sm:rounded-2xl">
          <LocationPicker
            locale={locale}
            pickup={pickup}
            dropoff={dropoff}
            onPickup={setPickup}
            onDropoff={setDropoff}
            near={geo.coords ?? undefined}
            fetcher={fetcher}
          />
          {pickup && dropoff ? (
            <>
              <RideTypePicker
                value={rideType}
                onChange={setRideType}
                options={options}
                loading={estimating}
                locale={locale}
              />
              {selectedOption ? (
                <FareSummary
                  total={selectedOption.estimate.breakdown.total}
                  distance={formatDistance(
                    selectedOption.estimate.distance * 1000,
                    locale === 'ar' ? 'ar-EG' : 'en-EG',
                  )}
                  duration={formatEta(
                    selectedOption.estimate.duration * 60,
                    locale === 'ar' ? 'ar-EG' : 'en-EG',
                  )}
                  surge={selectedOption.estimate.surgeMultiplier}
                  formatted={formatMoney(selectedOption.estimate.breakdown.total)}
                  locale={locale}
                />
              ) : null}
              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
                locale={locale}
              />
              <PromoInput
                value={promoCode}
                onChange={setPromoCode}
                onApplied={setAppliedPromo}
                locale={locale}
              />
              <button
                type="button"
                disabled={booking || estimating || !selectedOption}
                onClick={handleConfirm}
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-md bg-[var(--color-brand-600)] text-base font-semibold text-white hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-busy={booking || undefined}
              >
                {booking
                  ? ar
                    ? 'جاري الحجز…'
                    : 'Booking…'
                  : ar
                    ? 'تأكيد الحجز'
                    : 'Confirm booking'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
