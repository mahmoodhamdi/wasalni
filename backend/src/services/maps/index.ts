import { logger } from '../../utils/logger';
import { GoogleMapsProvider } from './google.provider';
import { MapboxProvider } from './mapbox.provider';
import { MockMapsProvider } from './mock.provider';
import { OsmMapsProvider } from './osm.provider';
import type { MapsProvider } from './types';

let instance: MapsProvider | null = null;

export const resolveMapsProvider = (override?: string): MapsProvider => {
  const choice = (override || process.env.MAPS_PROVIDER || 'osm').toLowerCase();
  switch (choice) {
    case 'google':
      return new GoogleMapsProvider();
    case 'mapbox':
      return new MapboxProvider();
    case 'mock':
      return new MockMapsProvider();
    case 'osm':
    default:
      return new OsmMapsProvider();
  }
};

export const getMapsProvider = (): MapsProvider => {
  if (!instance) {
    instance = resolveMapsProvider();
    logger.info(`Maps provider initialized: ${instance.info.name} (free=${instance.info.isFree})`);
  }
  return instance;
};

export const setMapsProvider = (provider: MapsProvider): void => {
  instance = provider;
};

export * from './types';
export { GoogleMapsProvider, MapboxProvider, MockMapsProvider, OsmMapsProvider };
