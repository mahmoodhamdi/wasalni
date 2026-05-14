'use client';

import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { LngLatLike } from 'maplibre-gl';

export interface PinMarkerProps {
  longitude: number;
  latitude: number;
  /** Visual style. */
  variant?: 'pickup' | 'dropoff' | 'driver' | 'user' | 'neutral';
  /** Optional rotation (degrees). Used for the driver heading. */
  bearing?: number;
  /** Draggable: caller handles onDragEnd to update coords. */
  draggable?: boolean;
  onDragEnd?: (lngLat: LngLatLike) => void;
  /** Optional label rendered next to the pin. */
  label?: string;
  /** Custom z-index for overlap ordering. */
  zIndex?: number;
}

const variantColours: Record<NonNullable<PinMarkerProps['variant']>, string> = {
  pickup: '#0b6b7c',
  dropoff: '#c2410c',
  driver: '#1f6e2c',
  user: '#1f3a8a',
  neutral: '#374151',
};

export function PinMarker({
  longitude,
  latitude,
  variant = 'neutral',
  bearing,
  draggable,
  onDragEnd,
  label,
  zIndex,
}: PinMarkerProps): React.ReactElement {
  const colour = variantColours[variant];

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      draggable={draggable}
      onDragEnd={(e) => {
        onDragEnd?.([e.lngLat.lng, e.lngLat.lat]);
      }}
      anchor="bottom"
      style={zIndex !== undefined ? { zIndex } : undefined}
    >
      <div
        style={{
          transform: bearing !== undefined ? `rotate(${bearing}deg)` : undefined,
          transformOrigin: 'center bottom',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true">
          <path
            d="M16 0 C7 0, 0 7, 0 16 C0 26, 16 40, 16 40 C16 40, 32 26, 32 16 C32 7, 25 0, 16 0 Z"
            fill={colour}
            stroke="#ffffff"
            strokeWidth="2"
          />
          <circle cx="16" cy="14" r="5" fill="#ffffff" />
        </svg>
        {label ? (
          <span
            style={{
              background: '#ffffff',
              color: '#111827',
              fontSize: 12,
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
    </Marker>
  );
}
