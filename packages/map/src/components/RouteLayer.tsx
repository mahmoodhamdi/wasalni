'use client';

import * as React from 'react';
import { Source, Layer, type LayerProps } from 'react-map-gl/maplibre';
import type { Feature, LineString } from 'geojson';

export interface RouteCoord {
  longitude: number;
  latitude: number;
}

export interface RouteLayerProps {
  /** Polyline points in `[lng, lat]` order. */
  coordinates: ReadonlyArray<RouteCoord>;
  /** Stroke colour. */
  color?: string;
  /** Stroke width in pixels at zoom 12. */
  width?: number;
  /** Unique id (allows multiple routes on one map). */
  id?: string;
  /** Show the "outline" stroke beneath for contrast. */
  outline?: boolean;
}

/**
 * Renders a polyline route on the map (typically the pickup → dropoff path
 * returned by the backend's routing service). Use one per route — pass a
 * unique `id` if rendering multiple.
 */
export function RouteLayer({
  coordinates,
  color = '#0b6b7c',
  width = 5,
  id = 'wasalni-route',
  outline = true,
}: RouteLayerProps): React.ReactElement | null {
  const geojson = React.useMemo<Feature<LineString>>(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map((c) => [c.longitude, c.latitude]),
      },
    }),
    [coordinates],
  );

  if (coordinates.length < 2) return null;

  const outlineLayer: LayerProps = {
    id: `${id}-outline`,
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': width + 4,
      'line-opacity': 0.9,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  };

  const lineLayer: LayerProps = {
    id,
    type: 'line',
    paint: {
      'line-color': color,
      'line-width': width,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  };

  return (
    <Source id={`${id}-src`} type="geojson" data={geojson}>
      {outline ? <Layer {...outlineLayer} /> : null}
      <Layer {...lineLayer} />
    </Source>
  );
}
