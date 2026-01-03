import {
  Client,
  DirectionsRequest,
  DirectionsResponse,
  PlaceAutocompleteRequest,
  PlaceAutocompleteResponse,
  GeocodeRequest,
  GeocodeResponse,
  ReverseGeocodeRequest,
  ReverseGeocodeResponse,
  DistanceMatrixRequest,
  DistanceMatrixResponse,
  TravelMode,
  Language,
} from '@googlemaps/google-maps-services-js';
import { config } from './index';
import { logger } from '../utils/logger';

const mapsClient = new Client({});

// Get directions between two points
export const getDirections = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[]
): Promise<DirectionsResponse['data'] | null> => {
  if (!config.googleMaps.apiKey) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const request: DirectionsRequest = {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: TravelMode.driving,
        language: Language.ar,
        key: config.googleMaps.apiKey,
      },
    };

    if (waypoints && waypoints.length > 0) {
      request.params.waypoints = waypoints.map((wp) => `${wp.lat},${wp.lng}`);
    }

    const response = await mapsClient.directions(request);
    return response.data;
  } catch (error) {
    logger.error(`Google Maps Directions API error: ${error}`);
    return null;
  }
};

// Get place autocomplete suggestions
export const getPlaceAutocomplete = async (
  input: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceAutocompleteResponse['data'] | null> => {
  if (!config.googleMaps.apiKey) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const request: PlaceAutocompleteRequest = {
      params: {
        input,
        language: Language.ar,
        components: ['country:eg'], // Restrict to Egypt
        key: config.googleMaps.apiKey,
      },
    };

    if (location) {
      request.params.location = `${location.lat},${location.lng}`;
      request.params.radius = radius || 50000; // 50km default
    }

    const response = await mapsClient.placeAutocomplete(request);
    return response.data;
  } catch (error) {
    logger.error(`Google Maps Places Autocomplete API error: ${error}`);
    return null;
  }
};

// Geocode an address to coordinates
export const geocodeAddress = async (
  address: string
): Promise<GeocodeResponse['data'] | null> => {
  if (!config.googleMaps.apiKey) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const request: GeocodeRequest = {
      params: {
        address,
        language: Language.ar,
        region: 'eg',
        key: config.googleMaps.apiKey,
      },
    };

    const response = await mapsClient.geocode(request);
    return response.data;
  } catch (error) {
    logger.error(`Google Maps Geocoding API error: ${error}`);
    return null;
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResponse['data'] | null> => {
  if (!config.googleMaps.apiKey) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const request: ReverseGeocodeRequest = {
      params: {
        latlng: `${lat},${lng}`,
        language: Language.ar,
        key: config.googleMaps.apiKey,
      },
    };

    const response = await mapsClient.reverseGeocode(request);
    return response.data;
  } catch (error) {
    logger.error(`Google Maps Reverse Geocoding API error: ${error}`);
    return null;
  }
};

// Get distance matrix between multiple origins and destinations
export const getDistanceMatrix = async (
  origins: { lat: number; lng: number }[],
  destinations: { lat: number; lng: number }[]
): Promise<DistanceMatrixResponse['data'] | null> => {
  if (!config.googleMaps.apiKey) {
    logger.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const request: DistanceMatrixRequest = {
      params: {
        origins: origins.map((o) => `${o.lat},${o.lng}`),
        destinations: destinations.map((d) => `${d.lat},${d.lng}`),
        mode: TravelMode.driving,
        language: Language.ar,
        key: config.googleMaps.apiKey,
      },
    };

    const response = await mapsClient.distancematrix(request);
    return response.data;
  } catch (error) {
    logger.error(`Google Maps Distance Matrix API error: ${error}`);
    return null;
  }
};

// Calculate ETA between two points
export const calculateETA = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: number; duration: number } | null> => {
  const directions = await getDirections(origin, destination);

  if (!directions || !directions.routes || directions.routes.length === 0) {
    return null;
  }

  const route = directions.routes[0];
  const leg = route.legs[0];

  return {
    distance: leg.distance?.value || 0, // meters
    duration: leg.duration?.value || 0, // seconds
  };
};

export default {
  getDirections,
  getPlaceAutocomplete,
  geocodeAddress,
  reverseGeocode,
  getDistanceMatrix,
  calculateETA,
};
