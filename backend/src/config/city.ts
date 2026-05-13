import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { logger } from '../utils/logger';

export interface CityLatLng {
  lat: number;
  lng: number;
}

export interface CityRideType {
  id: 'economy' | 'comfort' | 'family' | 'tuktuk' | 'motorcycle';
  label_en: string;
  label_ar: string;
  icon: string;
  base_fare: number;
  per_km: number;
  per_minute: number;
  min_fare: number;
  max_passengers: number;
  allows_highways: boolean;
  max_radius_km?: number;
  helmet_required?: boolean;
}

export interface SurgeWindow {
  days: string[];
  from: string;
  to: string;
  multiplier: number;
}

export interface SurgeZone {
  id: string;
  label_ar: string;
  polygon: [number, number][];
  schedule: SurgeWindow[];
}

export interface CityConfig {
  schema_version: number;
  city: {
    slug: string;
    name_en: string;
    name_ar: string;
    governorate_en: string;
    governorate_ar: string;
    country: string;
    timezone: string;
    service_area: {
      center: CityLatLng;
      radius_km: number;
      polygon: [number, number][];
    };
    villages?: { slug: string; name_ar: string }[];
  };
  branding: {
    brand_name_en: string;
    brand_name_ar: string;
    tagline_en: string;
    tagline_ar: string;
    primary_color: string;
    accent_color: string;
    logo_url: string;
    splash_url: string;
    app_name_passenger: string;
    app_name_driver: string;
    support_phone: string;
    support_whatsapp: string;
    support_email: string;
  };
  locale: {
    default: string;
    supported: string[];
    currency: string;
    currency_symbol_ar: string;
    currency_symbol_en: string;
  };
  ride_types: CityRideType[];
  policies: {
    commission_rate: number;
    booking_fee: number;
    cancellation_grace_period_min: number;
    cancellation_fee_after_grace: number;
    driver_acceptance_window_sec: number;
    driver_min_rating: number;
    driver_min_completion_rate: number;
    surge_enabled: boolean;
    surge_min_multiplier: number;
    surge_max_multiplier: number;
    female_only_mode_enabled: boolean;
    intercity_premium_pct: number;
    ramadan_mode_enabled: boolean;
    scheduled_rides_enabled: boolean;
    corporate_accounts_enabled: boolean;
    in_app_voice_enabled: boolean;
    trip_sharing_enabled: boolean;
  };
  surge_zones?: SurgeZone[];
  providers: {
    sms: string;
    payments: string[];
    maps: string;
  };
  regulatory: {
    driver_required_documents: string[];
    insurance_provider?: string;
    ntc_compliance: boolean;
    e_invoicing_enabled: boolean;
    data_residency: string;
  };
}

let cachedCity: CityConfig | null = null;

const findConfigPath = (citySlug: string): string => {
  const candidates = [
    process.env.WASALNI_CITY_CONFIG_PATH,
    path.join(process.cwd(), 'config', 'cities', `${citySlug}.yaml`),
    path.join(process.cwd(), '..', 'config', 'cities', `${citySlug}.yaml`),
    path.join(__dirname, '..', '..', '..', 'config', 'cities', `${citySlug}.yaml`),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`City config file not found for "${citySlug}". Checked: ${candidates.join(', ')}`);
};

export const loadCityConfig = (citySlug?: string): CityConfig => {
  const slug = citySlug || process.env.WASALNI_CITY || 'bagour';
  const filePath = findConfigPath(slug);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw) as CityConfig;

  if (parsed.schema_version !== 1) {
    throw new Error(`Unsupported city config schema version: ${parsed.schema_version}`);
  }
  if (!parsed.city?.slug || !parsed.ride_types?.length) {
    throw new Error('Invalid city config: missing city.slug or ride_types');
  }

  cachedCity = parsed;
  logger.info(
    `Loaded city config: ${parsed.city.name_en} (${parsed.city.slug}) — ${parsed.ride_types.length} ride types, ${parsed.providers.payments.length} payment providers`
  );
  return parsed;
};

export const getCityConfig = (): CityConfig => {
  if (!cachedCity) {
    return loadCityConfig();
  }
  return cachedCity;
};

export const isInServiceArea = (lat: number, lng: number, cfg?: CityConfig): boolean => {
  const city = (cfg || getCityConfig()).city;
  const polygon = city.service_area.polygon;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const findActiveSurgeMultiplier = (
  lat: number,
  lng: number,
  now: Date = new Date(),
  cfg?: CityConfig
): number => {
  const city = cfg || getCityConfig();
  if (!city.policies.surge_enabled || !city.surge_zones?.length) return 1.0;
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayMap[now.getDay()];
  const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  let best = 1.0;
  for (const zone of city.surge_zones) {
    // Check zone polygon
    let inside = false;
    for (let i = 0, j = zone.polygon.length - 1; i < zone.polygon.length; j = i++) {
      const [xi, yi] = zone.polygon[i];
      const [xj, yj] = zone.polygon[j];
      const intersect =
        yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    if (!inside) continue;
    for (const window of zone.schedule) {
      if (!window.days.includes(today)) continue;
      if (hhmm >= window.from && hhmm <= window.to) {
        if (window.multiplier > best) best = window.multiplier;
      }
    }
  }
  const cap = city.policies.surge_max_multiplier;
  return Math.min(best, cap);
};

export const resetCityConfigForTests = (): void => {
  cachedCity = null;
};
