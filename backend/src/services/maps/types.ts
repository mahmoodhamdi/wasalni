export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  location: Coordinates;
  types: string[];
  vicinity?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
  maneuver?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  polyline: string;
  startAddress: string;
  endAddress: string;
  steps: RouteStep[];
}

export interface ReverseGeocodeResult {
  address: string;
  shortAddress: string;
  city?: string;
  area?: string;
}

export interface GeocodeResult {
  location: Coordinates;
  formattedAddress: string;
}

export interface DistanceMatrixCell {
  distance: number;
  duration: number;
}

export interface MapsProviderInfo {
  name: 'google' | 'osm' | 'mapbox' | 'here' | 'mock';
  isFree: boolean;
  rateLimit?: string;
}

export interface MapsProvider {
  info: MapsProviderInfo;
  searchPlaces(query: string, near?: Coordinates, sessionToken?: string): Promise<PlacePrediction[]>;
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null>;
  geocode(address: string): Promise<GeocodeResult | null>;
  route(origin: Coordinates, destination: Coordinates, waypoints?: Coordinates[]): Promise<RouteInfo | null>;
  distanceMatrix(origins: Coordinates[], destinations: Coordinates[]): Promise<DistanceMatrixCell[][]>;
}
