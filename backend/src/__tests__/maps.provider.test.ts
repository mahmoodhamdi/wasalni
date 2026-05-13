import { MockMapsProvider } from '../services/maps/mock.provider';
import { resolveMapsProvider } from '../services/maps';

describe('Maps Provider Abstraction', () => {
  describe('MockMapsProvider', () => {
    const provider = new MockMapsProvider();

    it('reports correct info', () => {
      expect(provider.info.name).toBe('mock');
      expect(provider.info.isFree).toBe(true);
    });

    it('returns predictions for any query', async () => {
      const results = await provider.searchPlaces('شارع الجمهورية');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].mainText).toContain('شارع الجمهورية');
    });

    it('reverse geocodes any coordinates inside Bagour', async () => {
      const result = await provider.reverseGeocode(30.5167, 30.7167);
      expect(result).not.toBeNull();
      expect(result?.city).toBe('الباجور');
    });

    it('routes between two points and calculates distance', async () => {
      const route = await provider.route(
        { lat: 30.5167, lng: 30.7167 },
        { lat: 30.55, lng: 30.74 }
      );
      expect(route).not.toBeNull();
      expect(route?.distance).toBeGreaterThan(0);
      expect(route?.duration).toBeGreaterThan(0);
    });

    it('handles distance matrix with multiple origins and destinations', async () => {
      const matrix = await provider.distanceMatrix(
        [
          { lat: 30.5167, lng: 30.7167 },
          { lat: 30.52, lng: 30.72 },
        ],
        [{ lat: 30.55, lng: 30.74 }]
      );
      expect(matrix.length).toBe(2);
      expect(matrix[0].length).toBe(1);
      expect(matrix[0][0].distance).toBeGreaterThan(0);
    });
  });

  describe('Factory resolver', () => {
    it('resolves mock when override is mock', () => {
      const p = resolveMapsProvider('mock');
      expect(p.info.name).toBe('mock');
    });

    it('defaults to osm when no override', () => {
      const oldEnv = process.env.MAPS_PROVIDER;
      delete process.env.MAPS_PROVIDER;
      const p = resolveMapsProvider();
      expect(p.info.name).toBe('osm');
      if (oldEnv) process.env.MAPS_PROVIDER = oldEnv;
    });

    it('resolves google via override', () => {
      const p = resolveMapsProvider('google');
      expect(p.info.name).toBe('google');
      expect(p.info.isFree).toBe(false);
    });

    it('resolves mapbox via override', () => {
      const p = resolveMapsProvider('mapbox');
      expect(p.info.name).toBe('mapbox');
    });
  });
});
