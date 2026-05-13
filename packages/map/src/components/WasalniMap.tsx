'use client';

import * as React from 'react';
import Map, {
  NavigationControl,
  type MapRef,
  type ViewState,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_STYLE_URL, ZOOM_MAX, ZOOM_MIN } from '../constants';

export interface WasalniMapProps {
  /** Initial viewport. Persists user pan/zoom afterwards. */
  initialView?: Partial<ViewState>;
  /** Fired after every viewport change. */
  onViewChange?: (view: ViewState) => void;
  /** Override the tile style URL (e.g. for a dark theme). */
  styleUrl?: string;
  /** Children render inside the Map context — markers, layers, controls. */
  children?: React.ReactNode;
  /** CSS class for the wrapper. The map fills its container. */
  className?: string;
  /** Disable user interaction (useful for static thumbnails). */
  interactive?: boolean;
  /** Forward the underlying MapRef for imperative actions (`mapRef.current?.flyTo(...)`). */
  mapRef?: React.Ref<MapRef>;
  /** A11y label for the map region. */
  'aria-label'?: string;
}

/**
 * Wasalni base map. Hardcodes:
 *  - OpenFreeMap vector tile style
 *  - Sensible zoom bounds (3..19) and default centre on Bagour
 *  - NavigationControl at top-right (RTL-flips automatically)
 *  - Drag rotate + touch pitch disabled (riders don't need 3D)
 *
 * Use the `mapRef` prop to imperatively `flyTo`, `fitBounds`, etc. when
 * the caller wants to re-centre on a pickup/dropoff.
 */
export function WasalniMap({
  initialView,
  onViewChange,
  styleUrl = TILE_STYLE_URL,
  children,
  className,
  interactive = true,
  mapRef,
  'aria-label': ariaLabel = 'Map',
}: WasalniMapProps): React.ReactElement {
  const baseView: Partial<ViewState> = {
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0,
    ...initialView,
  };

  const handleMove = React.useCallback(
    (evt: ViewStateChangeEvent) => {
      onViewChange?.(evt.viewState);
    },
    [onViewChange],
  );

  return (
    <div
      className={className}
      role="region"
      aria-label={ariaLabel}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <Map
        ref={mapRef}
        mapStyle={styleUrl}
        initialViewState={baseView as ViewState}
        onMove={handleMove}
        maxZoom={ZOOM_MAX}
        minZoom={ZOOM_MIN}
        interactive={interactive}
        dragRotate={false}
        touchPitch={false}
        attributionControl={true}
        cursor={interactive ? undefined : 'default'}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {children}
      </Map>
    </div>
  );
}
