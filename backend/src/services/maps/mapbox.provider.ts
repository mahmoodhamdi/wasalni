import axios from 'axios';
import { logger } from '../../utils/logger';
import type {
  Coordinates,
  DistanceMatrixCell,
  GeocodeResult,
  MapsProvider,
  MapsProviderInfo,
  PlacePrediction,
  ReverseGeocodeResult,
  RouteInfo,
} from './types';

const MAPBOX_BASE = 'https://api.mapbox.com';

interface MapboxFeature {
  id?: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
  place_type?: string[];
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[];
}

interface MapboxRouteStep {
  maneuver: { instruction?: string; type?: string; location?: [number, number] };
  distance: number;
  duration: number;
  geometry?: { coordinates: [number, number][] };
}

interface MapboxRoute {
  distance: number;
  duration: number;
  geometry: string;
  legs: Array<{ steps: MapboxRouteStep[] }>;
}

interface MapboxDirectionsResponse {
  routes?: MapboxRoute[];
}

interface MapboxMatrixResponse {
  distances?: number[][];
  durations?: number[][];
}

export class MapboxProvider implements MapsProvider {
  info: MapsProviderInfo = { name: 'mapbox', isFree: false, rateLimit: 'See Mapbox pricing' };

  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.MAPBOX_ACCESS_TOKEN || '';
  }

  async searchPlaces(query: string, near?: Coordinates): Promise<PlacePrediction[]> {
    try {
      const proximity = near ? `&proximity=${near.lng},${near.lat}` : '';
      const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}&country=eg&language=ar&limit=5${proximity}`;
      const res = await axios.get<MapboxGeocodingResponse>(url, { timeout: 8000 });
      return res.data.features.map((f) => ({
        placeId: f.id || f.place_name,
        description: f.place_name,
        mainText: f.text,
        secondaryText: f.context?.map((c) => c.text).join('، ') || '',
        types: f.place_type || [],
      }));
    } catch (e) {
      logger.error(`Mapbox places autocomplete failed: ${e}`);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.token}&language=ar`;
      const res = await axios.get<MapboxGeocodingResponse>(url, { timeout: 8000 });
      const first = res.data.features[0];
      if (!first) return null;
      const city = first.context?.find((c) => c.id.startsWith('place'))?.text;
      const area = first.context?.find((c) => c.id.startsWith('neighborhood'))?.text;
      return { address: first.place_name, shortAddress: first.text, city, area };
    } catch (e) {
      logger.error(`Mapbox reverse geocode failed: ${e}`);
      return null;
    }
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.token}&country=eg&language=ar&limit=1`;
      const res = await axios.get<MapboxGeocodingResponse>(url, { timeout: 8000 });
      const first = res.data.features[0];
      if (!first) return null;
      return {
        location: { lat: first.center[1], lng: first.center[0] },
        formattedAddress: first.place_name,
      };
    } catch (e) {
      logger.error(`Mapbox geocode failed: ${e}`);
      return null;
    }
  }

  async route(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<RouteInfo | null> {
    try {
      const coords = [origin, ...(waypoints || []), destination]
        .map((c) => `${c.lng},${c.lat}`)
        .join(';');
      const url = `${MAPBOX_BASE}/directions/v5/mapbox/driving/${coords}?access_token=${this.token}&geometries=polyline&steps=true&overview=full&language=ar`;
      const res = await axios.get<MapboxDirectionsResponse>(url, { timeout: 10000 });
      const route = res.data.routes?.[0];
      if (!route) return null;
      const allSteps = (route.legs || []).flatMap((leg) =>
        leg.steps.map((s) => ({
          instruction: s.maneuver.instruction || s.maneuver.type || '',
          distance: s.distance,
          duration: s.duration,
          startLocation: {
            lat: s.maneuver.location?.[1] || origin.lat,
            lng: s.maneuver.location?.[0] || origin.lng,
          },
          endLocation: {
            lat: s.maneuver.location?.[1] || destination.lat,
            lng: s.maneuver.location?.[0] || destination.lng,
          },
          maneuver: s.maneuver.type,
        }))
      );
      const km = route.distance / 1000;
      const min = route.duration / 60;
      return {
        distance: route.distance,
        duration: route.duration,
        distanceText: `${km.toFixed(1)} كم`,
        durationText: `${Math.round(min)} دقيقة`,
        polyline: route.geometry,
        startAddress: '',
        endAddress: '',
        steps: allSteps,
      };
    } catch (e) {
      logger.error(`Mapbox directions failed: ${e}`);
      return null;
    }
  }

  async distanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceMatrixCell[][]> {
    try {
      const all = [...origins, ...destinations];
      const coords = all.map((c) => `${c.lng},${c.lat}`).join(';');
      const sourceIdx = origins.map((_, i) => i).join(';');
      const destIdx = destinations.map((_, i) => i + origins.length).join(';');
      const url = `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving/${coords}?access_token=${this.token}&sources=${sourceIdx}&destinations=${destIdx}&annotations=distance,duration`;
      const res = await axios.get<MapboxMatrixResponse>(url, { timeout: 10000 });
      const result: DistanceMatrixCell[][] = [];
      for (let i = 0; i < origins.length; i++) {
        const row: DistanceMatrixCell[] = [];
        for (let j = 0; j < destinations.length; j++) {
          row.push({
            distance: res.data.distances?.[i]?.[j] || 0,
            duration: res.data.durations?.[i]?.[j] || 0,
          });
        }
        result.push(row);
      }
      return result;
    } catch (e) {
      logger.error(`Mapbox matrix failed: ${e}`);
      return [];
    }
  }
}
