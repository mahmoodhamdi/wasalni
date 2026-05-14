'use client';

import * as React from 'react';
import { Circle, Square } from 'lucide-react';
import { PlaceAutocomplete, type PlaceResult } from '@wasalni/map';
import type { Locale } from '@wasalni/i18n';

interface Props {
  locale: Locale;
  pickup: PlaceResult | null;
  dropoff: PlaceResult | null;
  onPickup: (place: PlaceResult | null) => void;
  onDropoff: (place: PlaceResult | null) => void;
  near?: { latitude: number; longitude: number };
  fetcher?: typeof fetch;
}

export function LocationPicker({
  locale,
  pickup,
  dropoff,
  onPickup,
  onDropoff,
  near,
  fetcher,
}: Props): React.ReactElement {
  const [pickupQ, setPickupQ] = React.useState(pickup?.name ?? '');
  const [dropoffQ, setDropoffQ] = React.useState(dropoff?.name ?? '');

  React.useEffect(() => {
    if (pickup) setPickupQ(pickup.name);
  }, [pickup]);
  React.useEffect(() => {
    if (dropoff) setDropoffQ(dropoff.name);
  }, [dropoff]);

  const ar = locale === 'ar';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Circle
          className="h-3 w-3 flex-shrink-0 fill-[var(--color-brand-600)] text-[var(--color-brand-600)]"
          aria-hidden="true"
        />
        <PlaceAutocomplete
          id="pickup"
          value={pickupQ}
          onChange={(v) => {
            setPickupQ(v);
            if (!v) onPickup(null);
          }}
          onSelect={(p) => {
            onPickup(p);
            setPickupQ(p.name);
          }}
          near={near}
          fetcher={fetcher}
          placeholder={ar ? 'نقطة الانطلاق' : 'Pickup location'}
          aria-label={ar ? 'نقطة الانطلاق' : 'Pickup location'}
          locale={locale}
        />
      </div>
      <div className="flex items-center gap-2">
        <Square
          className="h-3 w-3 flex-shrink-0 fill-[var(--color-danger-500)] text-[var(--color-danger-500)]"
          aria-hidden="true"
        />
        <PlaceAutocomplete
          id="dropoff"
          value={dropoffQ}
          onChange={(v) => {
            setDropoffQ(v);
            if (!v) onDropoff(null);
          }}
          onSelect={(p) => {
            onDropoff(p);
            setDropoffQ(p.name);
          }}
          near={near}
          fetcher={fetcher}
          placeholder={ar ? 'الوجهة' : 'Where to?'}
          aria-label={ar ? 'الوجهة' : 'Destination'}
          locale={locale}
        />
      </div>
    </div>
  );
}
