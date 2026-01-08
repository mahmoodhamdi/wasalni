/**
 * Maps Service using FREE OpenStreetMap APIs
 * - Nominatim for geocoding and place search
 * - OSRM for routing and directions
 *
 * TODO: Switch to Google Maps when billing is ready
 */

import {
  getDirections,
  getPlaceAutocomplete,
  geocodeAddress,
  reverseGeocode,
  calculateETA,
} from '../config/maps';
import { config } from '../config';
import { logger } from '../utils/logger';

// TODO: Switch to Google Maps when billing is ready
// import {
//   Client,
//   PlaceDetailsRequest,
//   PlaceDetailsResponse,
//   TravelMode,
//   Language,
// } from '@googlemaps/google-maps-services-js';

// Interfaces
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

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  distanceText: string;
  durationText: string;
  polyline: string;
  startAddress: string;
  endAddress: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
  maneuver?: string;
}

export interface FareEstimate {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  bookingFee: number;
  subtotal: number;
  total: number;
  currency: string;
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
}

/**
 * Search for places with autocomplete (Arabic support)
 * Uses Nominatim (FREE)
 */
export const searchPlaces = async (
  query: string,
  location?: Coordinates,
  sessionToken?: string
): Promise<PlacePrediction[]> => {
  try {
    const result = await getPlaceAutocomplete(query, location, 50000);

    if (!result || !result.predictions) {
      return [];
    }

    return result.predictions.map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text || '',
      types: prediction.types || [],
    }));
  } catch (error) {
    logger.error(`Place search failed: ${error}`);
    return [];
  }
};

/**
 * Get place details by place ID
 * Uses Nominatim reverse geocode as alternative
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  // Nominatim doesn't support getting details by place_id in the same way
  // This would need the coordinates to be passed in for reverse geocoding
  logger.warn('getPlaceDetails requires coordinates with Nominatim - use searchPlaces instead');
  return null;
};

/**
 * Get address from coordinates (reverse geocoding)
 * Uses Nominatim (FREE)
 */
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number
): Promise<{ address: string; shortAddress: string; city?: string; area?: string } | null> => {
  try {
    const result = await reverseGeocode(lat, lng);

    if (!result || !result.results || result.results.length === 0) {
      return null;
    }

    const firstResult = result.results[0];
    let city: string | undefined;
    let area: string | undefined;

    // Extract city and area from address components
    for (const component of firstResult.address_components) {
      const types = component.types as string[];
      if (types.includes('administrative_area_level_1')) {
        city = component.long_name;
      }
      if (types.includes('sublocality') || types.includes('neighborhood')) {
        area = component.long_name;
      }
    }

    // Get short address (usually the first 2 components)
    const shortAddress = firstResult.address_components
      .slice(0, 2)
      .map((c) => c.long_name)
      .join('، ');

    return {
      address: firstResult.formatted_address,
      shortAddress,
      city,
      area,
    };
  } catch (error) {
    logger.error(`Reverse geocoding failed: ${error}`);
    return null;
  }
};

/**
 * Get coordinates from address (geocoding)
 * Uses Nominatim (FREE)
 */
export const getCoordinatesFromAddress = async (
  address: string
): Promise<{ location: Coordinates; formattedAddress: string } | null> => {
  try {
    const result = await geocodeAddress(address);

    if (!result || !result.results || result.results.length === 0) {
      return null;
    }

    const firstResult = result.results[0];
    return {
      location: {
        lat: firstResult.geometry.location.lat,
        lng: firstResult.geometry.location.lng,
      },
      formattedAddress: firstResult.formatted_address,
    };
  } catch (error) {
    logger.error(`Geocoding failed: ${error}`);
    return null;
  }
};

/**
 * Calculate route between two points
 * Uses OSRM (FREE)
 */
export const calculateRoute = async (
  origin: Coordinates,
  destination: Coordinates,
  waypoints?: Coordinates[]
): Promise<RouteInfo | null> => {
  try {
    const result = await getDirections(origin, destination, waypoints);

    if (!result || !result.routes || result.routes.length === 0) {
      return null;
    }

    const route = result.routes[0];
    const leg = route.legs[0];

    const steps: RouteStep[] = leg.steps.map((step) => ({
      instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '', // Remove HTML tags
      distance: step.distance?.value || 0,
      duration: step.duration?.value || 0,
      startLocation: {
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      },
      endLocation: {
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      },
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
  } catch (error) {
    logger.error(`Route calculation failed: ${error}`);
    return null;
  }
};

/**
 * Calculate fare estimate for a trip
 */
export const calculateFareEstimate = async (
  origin: Coordinates,
  destination: Coordinates,
  rideCategory: 'economy' | 'comfort' | 'family' = 'economy'
): Promise<FareEstimate | null> => {
  try {
    const route = await calculateRoute(origin, destination);

    if (!route) {
      // Fallback to Haversine distance
      const distance = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const distanceMeters = distance * 1000;
      const durationSeconds = Math.round((distance / 30) * 3600); // Assume 30 km/h

      return calculateFareFromDistance(distanceMeters, durationSeconds, rideCategory);
    }

    return calculateFareFromDistance(route.distance, route.duration, rideCategory);
  } catch (error) {
    logger.error(`Fare estimation failed: ${error}`);
    return null;
  }
};

/**
 * Calculate fare from distance and duration
 */
function calculateFareFromDistance(
  distanceMeters: number,
  durationSeconds: number,
  rideCategory: 'economy' | 'comfort' | 'family'
): FareEstimate {
  // Get fare settings based on category
  const fareSettings = getFareSettings(rideCategory);

  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;

  const baseFare = fareSettings.baseFare;
  const distanceFare = distanceKm * fareSettings.perKm;
  const timeFare = durationMinutes * fareSettings.perMinute;
  const bookingFee = config.app.bookingFee;

  const subtotal = baseFare + distanceFare + timeFare;
  const total = Math.max(subtotal + bookingFee, fareSettings.minimumFare);

  return {
    baseFare: Math.round(baseFare),
    distanceFare: Math.round(distanceFare),
    timeFare: Math.round(timeFare),
    bookingFee,
    subtotal: Math.round(subtotal),
    total: Math.round(total),
    currency: 'EGP',
    distance: distanceMeters,
    duration: durationSeconds,
    distanceText: formatDistance(distanceMeters),
    durationText: formatDuration(durationSeconds),
  };
}

/**
 * Get fare settings for a ride category
 */
function getFareSettings(category: 'economy' | 'comfort' | 'family') {
  // Base multipliers for different categories
  const multipliers = {
    economy: 1.0,
    comfort: 1.4,
    family: 1.6,
  };

  const multiplier = multipliers[category];

  return {
    baseFare: config.fare.economy.baseFare * multiplier,
    perKm: config.fare.economy.perKm * multiplier,
    perMinute: config.fare.economy.perMinute * multiplier,
    minimumFare: config.fare.economy.minimumFare * multiplier,
  };
}

/**
 * Get ETA between two points
 * Uses OSRM (FREE)
 */
export const getEstimatedTime = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<{ minutes: number; text: string } | null> => {
  try {
    const result = await calculateETA(origin, destination);

    if (!result) {
      // Fallback to Haversine
      const distance = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const minutes = Math.round((distance / 30) * 60); // Assume 30 km/h
      return {
        minutes,
        text: formatDuration(minutes * 60),
      };
    }

    const minutes = Math.round(result.duration / 60);
    return {
      minutes,
      text: formatDuration(result.duration),
    };
  } catch (error) {
    logger.error(`ETA calculation failed: ${error}`);
    return null;
  }
};

/**
 * Check if a location is within Egypt service area
 */
export const isInServiceArea = (lat: number, lng: number): boolean => {
  // Egypt bounding box (approximate)
  const egyptBounds = {
    north: 31.7,
    south: 22.0,
    east: 36.9,
    west: 24.7,
  };

  return lat >= egyptBounds.south && lat <= egyptBounds.north && lng >= egyptBounds.west && lng <= egyptBounds.east;
};

/**
 * Get popular places near a location
 */
export const getNearbyPopularPlaces = async (
  location: Coordinates,
  type?: string
): Promise<PlaceDetails[]> => {
  // This would use the Places API nearby search
  // For now, return empty array - can be implemented if needed
  return [];
};

// Helper: Calculate Haversine distance in km
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

export default {
  searchPlaces,
  getPlaceDetails,
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  calculateRoute,
  calculateFareEstimate,
  getEstimatedTime,
  isInServiceArea,
  getNearbyPopularPlaces,
};

/*
// TODO: Switch to Google Maps when billing is ready
// Original Google Maps implementation:

import {
  Client,
  PlaceDetailsRequest,
  TravelMode,
  Language,
} from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  const request: PlaceDetailsRequest = {
    params: {
      place_id: placeId,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'vicinity'],
      language: Language.ar,
      key: config.googleMaps.apiKey,
    },
  };
  const response = await mapsClient.placeDetails(request);
  // ... rest of implementation
};
*/
