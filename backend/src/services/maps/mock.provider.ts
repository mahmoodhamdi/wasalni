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

const haversine = (a: Coordinates, b: Coordinates): number => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
};

export class MockMapsProvider implements MapsProvider {
  info: MapsProviderInfo = { name: 'mock', isFree: true };

  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    return [
      {
        placeId: `mock:${query}:1`,
        description: `${query} - وسط الباجور`,
        mainText: query,
        secondaryText: 'الباجور، المنوفية',
        types: ['locality'],
      },
      {
        placeId: `mock:${query}:2`,
        description: `${query} - شارع الجمهورية`,
        mainText: `${query} - شارع الجمهورية`,
        secondaryText: 'الباجور، المنوفية',
        types: ['route'],
      },
    ];
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    return {
      address: `موقع تقريبي عند ${lat.toFixed(4)}, ${lng.toFixed(4)} - الباجور`,
      shortAddress: 'الباجور',
      city: 'الباجور',
      area: 'وسط المدينة',
    };
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    return {
      location: { lat: 30.5167, lng: 30.7167 },
      formattedAddress: `${address}، الباجور، المنوفية`,
    };
  }

  async route(origin: Coordinates, destination: Coordinates): Promise<RouteInfo | null> {
    const meters = haversine(origin, destination);
    const seconds = Math.round((meters / 1000) * 90);
    return {
      distance: Math.round(meters),
      duration: seconds,
      distanceText: `${(meters / 1000).toFixed(1)} كم`,
      durationText: `${Math.round(seconds / 60)} دقيقة`,
      polyline: '',
      startAddress: 'نقطة البداية',
      endAddress: 'الوجهة',
      steps: [
        {
          instruction: 'تابع إلى الوجهة',
          distance: Math.round(meters),
          duration: seconds,
          startLocation: origin,
          endLocation: destination,
        },
      ],
    };
  }

  async distanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceMatrixCell[][]> {
    return origins.map((o) =>
      destinations.map((d) => {
        const meters = haversine(o, d);
        return { distance: Math.round(meters), duration: Math.round((meters / 1000) * 90) };
      })
    );
  }
}
