import path from 'path';
import {
  loadCityConfig,
  isInServiceArea,
  findActiveSurgeMultiplier,
  resetCityConfigForTests,
} from '../config/city';

const BAGOUR = path.resolve(__dirname, '..', '..', '..', 'config', 'cities', 'bagour.yaml');
const TANTA = path.resolve(__dirname, '..', '..', '..', 'config', 'cities', 'tanta.yaml');

describe('City Configuration System', () => {
  beforeEach(() => {
    resetCityConfigForTests();
    process.env.WASALNI_CITY_CONFIG_PATH = BAGOUR;
  });

  afterAll(() => {
    delete process.env.WASALNI_CITY_CONFIG_PATH;
    resetCityConfigForTests();
  });

  it('loads Bagour config with all expected fields', () => {
    const cfg = loadCityConfig('bagour');
    expect(cfg.city.slug).toBe('bagour');
    expect(cfg.city.name_ar).toBe('الباجور');
    expect(cfg.ride_types).toHaveLength(5);
    expect(cfg.ride_types.map((r) => r.id)).toEqual([
      'economy',
      'comfort',
      'family',
      'tuktuk',
      'motorcycle',
    ]);
  });

  it('Bagour tuktuk is not allowed on highways', () => {
    const cfg = loadCityConfig('bagour');
    const tuktuk = cfg.ride_types.find((r) => r.id === 'tuktuk');
    expect(tuktuk?.allows_highways).toBe(false);
    expect(tuktuk?.max_radius_km).toBe(8);
  });

  it('Bagour motorcycle requires helmet', () => {
    const cfg = loadCityConfig('bagour');
    const moto = cfg.ride_types.find((r) => r.id === 'motorcycle');
    expect(moto?.helmet_required).toBe(true);
  });

  it('Bagour service area includes city center and excludes far points', () => {
    const cfg = loadCityConfig('bagour');
    expect(isInServiceArea(30.5167, 30.7167, cfg)).toBe(true);
    expect(isInServiceArea(30.1, 30.1, cfg)).toBe(false);
    expect(isInServiceArea(31.5, 31.5, cfg)).toBe(false);
  });

  it('Loads Tanta config with different fares', () => {
    process.env.WASALNI_CITY_CONFIG_PATH = TANTA;
    resetCityConfigForTests();
    const cfg = loadCityConfig('tanta');
    expect(cfg.city.name_ar).toBe('طنطا');
    const economy = cfg.ride_types.find((r) => r.id === 'economy');
    expect(economy?.base_fare).toBe(10);
    expect(cfg.policies.commission_rate).toBe(0.18);
    expect(cfg.providers.maps).toBe('google');
  });

  it('Bagour Friday afternoon at market square triggers 1.5x surge', () => {
    const cfg = loadCityConfig('bagour');
    const fridayAfternoon = new Date('2026-05-15T18:00:00+02:00');
    const m = findActiveSurgeMultiplier(30.5175, 30.7175, fridayAfternoon, cfg);
    expect(m).toBeGreaterThanOrEqual(1.3);
  });

  it('Bagour Monday morning has no surge', () => {
    const cfg = loadCityConfig('bagour');
    const mondayMorning = new Date('2026-05-11T09:00:00+02:00');
    const m = findActiveSurgeMultiplier(30.5175, 30.7175, mondayMorning, cfg);
    expect(m).toBe(1.0);
  });

  it('Bagour villages list is populated', () => {
    const cfg = loadCityConfig('bagour');
    expect(cfg.city.villages?.length).toBeGreaterThanOrEqual(10);
    const slugs = cfg.city.villages?.map((v) => v.slug) || [];
    expect(slugs).toContain('kafr-elbagour');
    expect(slugs).toContain('shanwan');
  });
});
