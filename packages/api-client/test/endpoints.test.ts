import { describe, expect, it } from 'vitest';
import {
  AuthEndpoints,
  DriverEndpoints,
  FareEndpoints,
  PlacesEndpoints,
  PromosEndpoints,
  SafetyEndpoints,
  TripsEndpoints,
  WalletEndpoints,
} from '../src';
import { buildClient } from './helpers';

describe('endpoint groups call the right URLs', () => {
  it('Auth.requestOtp POSTs /auth/send-otp (phone→synthetic email adapter)', async () => {
    const { client, calls } = buildClient({
      '/v1/auth/send-otp': {
        status: 200,
        body: { success: true, data: { expiresIn: 300 } },
      },
    });
    const auth = new AuthEndpoints(client);
    const r = await auth.requestOtp({ phone: '+201012345678' });
    expect(r.retryAfter).toBe(300);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toContain('/auth/send-otp');
    // Adapter rewrites phone to a synthesised email so the backend's
    // email-based OTP flow accepts the request.
    const body = JSON.parse(calls[0]!.body ?? '{}') as { email: string; purpose: string };
    expect(body.email).toBe('201012345678@phone.wasalni.local');
    expect(body.purpose).toBe('login');
  });

  it('Auth.me GETs /auth/profile (the backend route)', async () => {
    const { client, calls } = buildClient({
      '/v1/auth/profile': {
        status: 200,
        body: { success: true, data: { _id: 'u1', name: 'A', phone: '+20', role: 'passenger' } },
      },
    });
    const auth = new AuthEndpoints(client);
    await auth.me();
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.url).toContain('/auth/profile');
  });

  it('Places.search builds query string', async () => {
    const { client, calls } = buildClient({
      '*': { status: 200, body: { success: true, data: [] } },
    });
    const places = new PlacesEndpoints(client);
    await places.search({ query: 'Cairo', near: { latitude: 30, longitude: 31 }, limit: 5 });
    expect(calls[0]!.url).toContain('q=Cairo');
    expect(calls[0]!.url).toContain('lat=30');
    expect(calls[0]!.url).toContain('lng=31');
    expect(calls[0]!.url).toContain('limit=5');
  });

  it('Fare.estimate POSTs /fare/estimate', async () => {
    const { client, calls } = buildClient({
      '/v1/fare/estimate': {
        status: 200,
        body: { success: true, data: { options: [] } },
      },
    });
    const fare = new FareEndpoints(client);
    await fare.estimate({
      pickup: { latitude: 0, longitude: 0, address: 'A' },
      dropoff: { latitude: 0, longitude: 0, address: 'B' },
      rideType: 'economy',
    });
    expect(calls[0]!.method).toBe('POST');
  });

  it('Trips.book/byId/cancel hit the right paths', async () => {
    const { client, calls } = buildClient({
      '/v1/trips': { status: 200, body: { success: true, data: { _id: 't1' } } },
      '/v1/trips/t1': { status: 200, body: { success: true, data: { _id: 't1' } } },
      '/v1/trips/t1/cancel': { status: 200, body: { success: true, data: { _id: 't1' } } },
    });
    const trips = new TripsEndpoints(client);
    await trips.book({
      pickup: { latitude: 0, longitude: 0, address: 'A' },
      dropoff: { latitude: 0, longitude: 0, address: 'B' },
      rideType: 'economy',
      paymentMethod: 'cash',
    });
    await trips.byId('t1');
    await trips.cancel({ tripId: 't1', reason: 'passenger_cancelled' });
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toContain('/trips');
    expect(calls[1]!.url).toContain('/trips/t1');
    expect(calls[2]!.url).toContain('/trips/t1/cancel');
  });

  it('Driver.setStatus and earnings', async () => {
    const { client, calls } = buildClient({
      '/v1/driver/status': { status: 200, body: { success: true, data: { status: 'online' } } },
      '/v1/driver/earnings/summary': {
        status: 200,
        body: {
          success: true,
          data: { today: 0, week: 0, month: 0, pendingPayout: 0, totalTrips: 0 },
        },
      },
    });
    const d = new DriverEndpoints(client);
    await d.setStatus('online');
    await d.earningsSummary();
    expect(calls[0]!.method).toBe('POST');
    expect(calls[1]!.method).toBe('GET');
  });

  it('Wallet.summary + withdraw', async () => {
    const { client, calls } = buildClient({
      '/v1/wallet': {
        status: 200,
        body: { success: true, data: { balance: 100, pendingPayout: 0, recentTransactions: [] } },
      },
      '/v1/wallet/withdraw': {
        status: 200,
        body: { success: true, data: { ok: true, reference: 'r1' } },
      },
    });
    const w = new WalletEndpoints(client);
    await w.summary();
    await w.withdraw({ amount: 50 });
    expect(calls[0]!.method).toBe('GET');
    expect(calls[1]!.method).toBe('POST');
  });

  it('Promos.validate builds query', async () => {
    const { client, calls } = buildClient({
      '*': { status: 200, body: { success: true, data: { valid: true, code: 'WELCOME' } } },
    });
    const p = new PromosEndpoints(client);
    await p.validate('WELCOME');
    expect(calls[0]!.url).toContain('code=WELCOME');
  });

  it('Safety.sos POSTs /safety/sos', async () => {
    const { client, calls } = buildClient({
      '/v1/safety/sos': {
        status: 200,
        body: { success: true, data: { ok: true, alertId: 'a1' } },
      },
    });
    const s = new SafetyEndpoints(client);
    await s.sos({
      coords: { latitude: 0, longitude: 0 },
      reason: 'feeling_unsafe',
    });
    expect(calls[0]!.method).toBe('POST');
  });
});
