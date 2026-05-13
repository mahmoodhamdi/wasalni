import { Client, TravelMode, Language } from '@googlemaps/google-maps-services-js';
import { config } from '../../config';
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

export class GoogleMapsProvider implements MapsProvider {
  private client = new Client({});

  info: MapsProviderInfo = {
    name: 'google',
    isFree: false,
    rateLimit: 'See Google Maps Platform pricing',
  };

  private get key(): string {
    return config.googleMaps.apiKey || '';
  }

  async searchPlaces(
    query: string,
    near?: Coordinates,
    sessionToken?: string
  ): Promise<PlacePrediction[]> {
    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input: query,
          key: this.key,
          language: Language.ar,
          sessiontoken: sessionToken,
          location: near ? `${near.lat},${near.lng}` : undefined,
          radius: near ? 50000 : undefined,
          components: ['country:eg'],
        },
        timeout: 8000,
      });
      return response.data.predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text || '',
        types: p.types || [],
      }));
    } catch (e) {
      logger.error(`Google places autocomplete failed: ${e}`);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: { latlng: { lat, lng }, language: Language.ar, key: this.key },
        timeout: 8000,
      });
      const first = response.data.results[0];
      if (!first) return null;
      let city: string | undefined;
      let area: string | undefined;
      for (const c of first.address_components) {
        if (c.types.includes('administrative_area_level_1' as never)) city = c.long_name;
        if (
          c.types.includes('sublocality' as never) ||
          c.types.includes('neighborhood' as never)
        )
          area = c.long_name;
      }
      const shortAddress = first.address_components
        .slice(0, 2)
        .map((c) => c.long_name)
        .join('، ');
      return { address: first.formatted_address, shortAddress, city, area };
    } catch (e) {
      logger.error(`Google reverse geocode failed: ${e}`);
      return null;
    }
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await this.client.geocode({
        params: { address, key: this.key, language: Language.ar, region: 'eg' },
        timeout: 8000,
      });
      const first = response.data.results[0];
      if (!first) return null;
      return {
        location: { lat: first.geometry.location.lat, lng: first.geometry.location.lng },
        formattedAddress: first.formatted_address,
      };
    } catch (e) {
      logger.error(`Google geocode failed: ${e}`);
      return null;
    }
  }

  async route(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<RouteInfo | null> {
    try {
      const response = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          waypoints: waypoints?.map((w) => `${w.lat},${w.lng}`),
          mode: TravelMode.driving,
          language: Language.ar,
          key: this.key,
        },
        timeout: 10000,
      });
      const route = response.data.routes[0];
      if (!route) return null;
      const leg = route.legs[0];
      const steps: RouteStep[] = leg.steps.map((s) => ({
        instruction: s.html_instructions?.replace(/<[^>]*>/g, '') || '',
        distance: s.distance.value,
        duration: s.duration.value,
        startLocation: { lat: s.start_location.lat, lng: s.start_location.lng },
        endLocation: { lat: s.end_location.lat, lng: s.end_location.lng },
        maneuver: s.maneuver,
      }));
      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        polyline: route.overview_polyline.points,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps,
      };
    } catch (e) {
      logger.error(`Google directions failed: ${e}`);
      return null;
    }
  }

  async distanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceMatrixCell[][]> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: origins.map((o) => `${o.lat},${o.lng}`),
          destinations: destinations.map((d) => `${d.lat},${d.lng}`),
          mode: TravelMode.driving,
          key: this.key,
        },
        timeout: 10000,
      });
      return response.data.rows.map((row) =>
        row.elements.map((el) => ({
          distance: el.distance?.value || 0,
          duration: el.duration?.value || 0,
        }))
      );
    } catch (e) {
      logger.error(`Google distance matrix failed: ${e}`);
      return [];
    }
  }
}
