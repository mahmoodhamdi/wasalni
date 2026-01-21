/**
 * FREE Maps Configuration using OpenStreetMap APIs
 * - Nominatim for geocoding (1 req/sec limit)
 * - OSRM for routing
 *
 * TODO: Switch to Google Maps when billing is ready
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';
import { logger } from '../utils/logger';

// API endpoints (FREE)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// User agent required by Nominatim
const USER_AGENT = 'Wasalni/1.0 (wasalni.app@gmail.com)';

// Egypt bounding box
const EGYPT_BOUNDS = {
  viewbox: '24.7,22.0,36.9,31.7', // west,south,east,north
  countrycodes: 'eg',
};

// OSRM API response interfaces
interface OSRMStep {
  name?: string;
  distance?: number;
  duration?: number;
  maneuver?: {
    type?: string;
    location?: [number, number];
  };
}

interface OSRMLeg {
  distance?: number;
  duration?: number;
  steps?: OSRMStep[];
}

interface OSRMRoute {
  distance?: number;
  duration?: number;
  geometry?: string;
  legs: OSRMLeg[];
}

interface OSRMResponse {
  code: string;
  routes?: OSRMRoute[];
  durations?: (number | null)[][];
  distances?: (number | null)[][];
}

// Nominatim API response interfaces
interface NominatimPlace {
  place_id?: number;
  display_name?: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  address?: NominatimAddress;
}

interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  governorate?: string;
  country?: string;
  postcode?: string;
  [key: string]: string | undefined;
}

// Distance matrix result interface
interface DistanceMatrixResult {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      status: string;
    }>;
  }>;
}

// Rate limiting for Nominatim (1 request per second)
let lastNominatimRequest = 0;

const respectRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const elapsed = now - lastNominatimRequest;
  if (elapsed < 1000) {
    await setTimeout(1000 - elapsed);
  }
  lastNominatimRequest = Date.now();
};

// Interfaces matching the old Google Maps structure for backward compatibility
interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
      start_address?: string;
      end_address?: string;
      steps: Array<{
        html_instructions?: string;
        distance?: { value: number };
        duration?: { value: number };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        maneuver?: string;
      }>;
    }>;
    overview_polyline?: { points: string };
  }>;
}

interface GeocodeResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

interface PlaceAutocompleteResult {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types?: string[];
  }>;
}

/**
 * Get directions between two points using OSRM (FREE)
 */
export const getDirections = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[]
): Promise<DirectionsResult | null> => {
  try {
    // Build coordinates string
    let coordinates = `${origin.lng},${origin.lat}`;
    if (waypoints && waypoints.length > 0) {
      for (const wp of waypoints) {
        coordinates += `;${wp.lng},${wp.lat}`;
      }
    }
    coordinates += `;${destination.lng},${destination.lat}`;

    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=polyline&steps=true`;

    const response = await axios.get<OSRMResponse>(url);

    if (response.data.code !== 'Ok' || !response.data.routes?.[0]) {
      return null;
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    // Convert OSRM format to compatible format
    const steps = leg.steps?.map((step: OSRMStep) => ({
      html_instructions: step.name || step.maneuver?.type || '',
      distance: { value: step.distance || 0 },
      duration: { value: step.duration || 0 },
      start_location: {
        lat: step.maneuver?.location?.[1] || origin.lat,
        lng: step.maneuver?.location?.[0] || origin.lng,
      },
      end_location: {
        lat: step.maneuver?.location?.[1] || destination.lat,
        lng: step.maneuver?.location?.[0] || destination.lng,
      },
      maneuver: step.maneuver?.type,
    })) || [];

    return {
      routes: [{
        legs: [{
          distance: {
            value: route.distance || 0,
            text: formatDistance(route.distance || 0)
          },
          duration: {
            value: route.duration || 0,
            text: formatDuration(route.duration || 0)
          },
          start_address: '', // Will be filled by reverse geocoding if needed
          end_address: '',
          steps,
        }],
        overview_polyline: { points: route.geometry || '' },
      }],
    };
  } catch (error) {
    logger.error(`OSRM Directions API error: ${error}`);
    return null;
  }
};

/**
 * Get place autocomplete using Nominatim (FREE)
 */
export const getPlaceAutocomplete = async (
  input: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceAutocompleteResult | null> => {
  try {
    await respectRateLimit();

    let url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(input)}`;
    url += `&countrycodes=${EGYPT_BOUNDS.countrycodes}`;
    url += `&limit=5`;
    url += `&addressdetails=1`;
    url += `&accept-language=ar,en`;

    // Add location bias if provided
    if (location) {
      const radiusInDeg = (radius || 50000) / 111000; // Convert meters to degrees (approx)
      const viewbox = `${location.lng - radiusInDeg},${location.lat - radiusInDeg},${location.lng + radiusInDeg},${location.lat + radiusInDeg}`;
      url += `&viewbox=${viewbox}&bounded=0`;
    } else {
      url += `&viewbox=${EGYPT_BOUNDS.viewbox}&bounded=1`;
    }

    const response = await axios.get<NominatimPlace[]>(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!Array.isArray(response.data)) {
      return { predictions: [] };
    }

    const predictions = response.data.map((place: NominatimPlace) => {
      const displayName = place.display_name || '';
      const mainText = place.name || displayName.split(',')[0];
      const secondaryText = displayName.split(',').slice(1, 3).join(',').trim();

      return {
        place_id: place.place_id?.toString() || '',
        description: displayName,
        structured_formatting: {
          main_text: mainText,
          secondary_text: secondaryText,
        },
        types: place.type ? [place.type] : [],
      };
    });

    return { predictions };
  } catch (error) {
    logger.error(`Nominatim Places Autocomplete error: ${error}`);
    return null;
  }
};

/**
 * Geocode an address to coordinates using Nominatim (FREE)
 */
export const geocodeAddress = async (
  address: string
): Promise<GeocodeResult | null> => {
  try {
    await respectRateLimit();

    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&countrycodes=${EGYPT_BOUNDS.countrycodes}&limit=1&addressdetails=1&accept-language=ar,en`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
      return { results: [] };
    }

    const place = response.data[0];
    const addressComponents = parseAddressComponents(place.address);

    return {
      results: [{
        formatted_address: place.display_name || '',
        geometry: {
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
          },
        },
        address_components: addressComponents,
      }],
    };
  } catch (error) {
    logger.error(`Nominatim Geocoding error: ${error}`);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address using Nominatim (FREE)
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodeResult | null> => {
  try {
    await respectRateLimit();

    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,en`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.data || response.data.error) {
      return { results: [] };
    }

    const place = response.data;
    const addressComponents = parseAddressComponents(place.address);

    return {
      results: [{
        formatted_address: place.display_name || '',
        geometry: {
          location: { lat, lng },
        },
        address_components: addressComponents,
      }],
    };
  } catch (error) {
    logger.error(`Nominatim Reverse Geocoding error: ${error}`);
    return null;
  }
};

/**
 * Get distance matrix using OSRM (FREE)
 */
export const getDistanceMatrix = async (
  origins: { lat: number; lng: number }[],
  destinations: { lat: number; lng: number }[]
): Promise<DistanceMatrixResult | null> => {
  try {
    // OSRM table service for distance matrix
    const allPoints = [...origins, ...destinations];
    const coordinates = allPoints.map(p => `${p.lng},${p.lat}`).join(';');

    const sourceIndices = origins.map((_, i) => i).join(';');
    const destIndices = destinations.map((_, i) => i + origins.length).join(';');

    const url = `${OSRM_BASE_URL}/table/v1/driving/${coordinates}?sources=${sourceIndices}&destinations=${destIndices}`;

    const response = await axios.get<OSRMResponse>(url);

    if (response.data.code !== 'Ok' || !response.data.durations) {
      return null;
    }

    // Convert to compatible format
    const rows = response.data.durations.map((durations, rowIndex) => ({
      elements: durations.map((duration, colIndex) => {
        const distance = response.data.distances?.[rowIndex]?.[colIndex] || 0;
        return {
          distance: { value: distance, text: formatDistance(distance) },
          duration: { value: duration || 0, text: formatDuration(duration || 0) },
          status: duration !== null ? 'OK' : 'ZERO_RESULTS',
        };
      }),
    }));

    return {
      origin_addresses: origins.map(() => ''),
      destination_addresses: destinations.map(() => ''),
      rows,
    };
  } catch (error) {
    logger.error(`OSRM Distance Matrix error: ${error}`);
    return null;
  }
};

/**
 * Calculate ETA between two points using OSRM (FREE)
 */
export const calculateETA = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: number; duration: number } | null> => {
  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

    const response = await axios.get(url);

    if (response.data.code !== 'Ok' || !response.data.routes?.[0]) {
      return null;
    }

    const route = response.data.routes[0];
    return {
      distance: route.distance || 0, // meters
      duration: route.duration || 0, // seconds
    };
  } catch (error) {
    logger.error(`OSRM ETA calculation error: ${error}`);
    return null;
  }
};

// Helper: Parse Nominatim address components to compatible format
function parseAddressComponents(address: NominatimAddress | undefined): Array<{ long_name: string; short_name: string; types: string[] }> {
  if (!address) return [];

  const components: Array<{ long_name: string; short_name: string; types: string[] }> = [];

  const mappings: Record<string, string[]> = {
    road: ['route'],
    neighbourhood: ['neighborhood', 'sublocality'],
    suburb: ['sublocality'],
    city: ['locality'],
    town: ['locality'],
    village: ['locality'],
    state: ['administrative_area_level_1'],
    governorate: ['administrative_area_level_1'],
    country: ['country'],
    postcode: ['postal_code'],
  };

  for (const [key, types] of Object.entries(mappings)) {
    if (address[key]) {
      components.push({
        long_name: address[key],
        short_name: address[key],
        types,
      });
    }
  }

  return components;
}

// Helper: Format distance in Arabic
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
}

// Helper: Format duration in Arabic
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
  getDirections,
  getPlaceAutocomplete,
  geocodeAddress,
  reverseGeocode,
  getDistanceMatrix,
  calculateETA,
};

/*
// TODO: Switch to Google Maps when billing is ready
// Original Google Maps implementation:

import {
  Client,
  DirectionsRequest,
  PlaceAutocompleteRequest,
  GeocodeRequest,
  ReverseGeocodeRequest,
  DistanceMatrixRequest,
  TravelMode,
  Language,
} from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

export const getDirections = async (origin, destination, waypoints) => {
  const request: DirectionsRequest = {
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: TravelMode.driving,
      language: Language.ar,
      key: config.googleMaps.apiKey,
    },
  };
  // ... rest of Google Maps implementation
};
*/
