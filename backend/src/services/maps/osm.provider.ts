import {
  getDirections,
  getPlaceAutocomplete,
  geocodeAddress,
  reverseGeocode,
  getDistanceMatrix,
} from '../../config/maps';
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
  RouteStep,
} from './types';

export class OsmMapsProvider implements MapsProvider {
  info: MapsProviderInfo = {
    name: 'osm',
    isFree: true,
    rateLimit: 'Nominatim: 1 req/sec; OSRM: best-effort public instance',
  };

  async searchPlaces(query: string, near?: Coordinates): Promise<PlacePrediction[]> {
    const result = await getPlaceAutocomplete(query, near, 50000);
    if (!result || !result.predictions) return [];
    return result.predictions.map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting.main_text,
      secondaryText: p.structured_formatting.secondary_text || '',
      types: p.types || [],
    }));
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    const result = await reverseGeocode(lat, lng);
    if (!result?.results?.length) return null;
    const first = result.results[0];
    let city: string | undefined;
    let area: string | undefined;
    for (const component of first.address_components) {
      const types = component.types as string[];
      if (types.includes('administrative_area_level_1')) city = component.long_name;
      if (types.includes('sublocality') || types.includes('neighborhood')) area = component.long_name;
    }
    const shortAddress = first.address_components
      .slice(0, 2)
      .map((c) => c.long_name)
      .join('، ');
    return { address: first.formatted_address, shortAddress, city, area };
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    const result = await geocodeAddress(address);
    if (!result?.results?.length) return null;
    const first = result.results[0];
    return {
      location: { lat: first.geometry.location.lat, lng: first.geometry.location.lng },
      formattedAddress: first.formatted_address,
    };
  }

  async route(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<RouteInfo | null> {
    const result = await getDirections(origin, destination, waypoints);
    if (!result?.routes?.length) return null;
    const route = result.routes[0];
    const leg = route.legs[0];
    const steps: RouteStep[] = leg.steps.map((step) => ({
      instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
      distance: step.distance?.value || 0,
      duration: step.duration?.value || 0,
      startLocation: { lat: step.start_location.lat, lng: step.start_location.lng },
      endLocation: { lat: step.end_location.lat, lng: step.end_location.lng },
      maneuver: step.maneuver,
    }));
    return {
      distance: leg.distance?.value || 0,
      duration: leg.duration?.value || 0,
      distanceText: leg.distance?.text || '',
      durationText: leg.duration?.text || '',
      polyline: route.overview_polyline?.points || '',
      startAddress: leg.start_address || '',
      endAddress: leg.end_address || '',
      steps,
    };
  }

  async distanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceMatrixCell[][]> {
    try {
      const result = await getDistanceMatrix(origins, destinations);
      if (!result?.rows) return [];
      return result.rows.map((row) =>
        row.elements.map((el) => ({
          distance: el.distance?.value || 0,
          duration: el.duration?.value || 0,
        }))
      );
    } catch (e) {
      logger.error(`OSM distance matrix failed: ${e}`);
      return [];
    }
  }
}
