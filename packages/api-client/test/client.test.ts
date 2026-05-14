import { describe, expect, it } from 'vitest';
import {
  ApiError,
  ApiClient,
  NetworkError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from '../src';
import { buildClient } from './helpers';

describe('ApiClient', () => {
  describe('envelope unwrapping', () => {
    it('returns data on success', async () => {
      const { client } = buildClient({
        '/v1/ping': { status: 200, body: { success: true, data: { ok: true } } },
      });
      await expect(client.get('/ping')).resolves.toEqual({ ok: true });
    });

    it('returns undefined for 204', async () => {
      const { client } = buildClient({
        '/v1/delete-me': { status: 204 },
      });
      await expect(client.delete('/delete-me')).resolves.toBeUndefined();
    });

    it('throws ApiError when success=false with non-error status', async () => {
      const { client } = buildClient({
        '/v1/fail': { status: 200, body: { success: false, error: 'nope' } },
      });
      await expect(client.get('/fail')).rejects.toThrowError(/nope/);
    });
  });

  describe('error mapping', () => {
    it('maps 401 → UnauthorizedError', async () => {
      const { client } = buildClient({
        '/v1/me': { status: 401, body: { success: false, error: 'no auth' } },
      });
      await expect(client.get('/me')).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('maps 422 → ValidationError with details', async () => {
      const { client } = buildClient({
        '/v1/x': {
          status: 422,
          body: {
            success: false,
            error: 'invalid',
            details: { phone: 'required' },
          },
        },
      });
      try {
        await client.post('/x', {});
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).details).toEqual({ phone: 'required' });
      }
    });

    it('maps 429 → RateLimitError with Retry-After', async () => {
      const { client } = buildClient({
        '/v1/y': {
          status: 429,
          body: { success: false, error: 'too many' },
          headers: { 'retry-after': '30' },
        },
      });
      try {
        await client.post('/y');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect((err as RateLimitError).retryAfter).toBe(30);
      }
    });

    it('maps other 4xx/5xx → ApiError', async () => {
      const { client } = buildClient({
        '/v1/z': { status: 500, body: { success: false, error: 'boom' } },
      });
      const err = await client.get('/z').catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
    });

    it('maps fetch rejection → NetworkError', async () => {
      const client = new ApiClient({
        baseUrl: 'http://api.test/v1',
        fetch: () => Promise.reject(new TypeError('network down')),
      });
      await expect(client.get('/anything')).rejects.toBeInstanceOf(NetworkError);
    });
  });

  describe('request shape', () => {
    it('serialises JSON body and sets content-type', async () => {
      const { client, calls } = buildClient({
        '/v1/echo': { status: 200, body: { success: true, data: 1 } },
      });
      await client.post('/echo', { name: 'Ali' });
      const c = calls.find((x) => x.url.endsWith('/echo'))!;
      expect(c.method).toBe('POST');
      expect(c.body).toBe(JSON.stringify({ name: 'Ali' }));
      expect(c.headers['content-type']).toBe('application/json');
    });

    it('attaches Authorization header from getAuthToken', async () => {
      const { buildMockFetch } = await import('./helpers');
      const { fetch, calls } = buildMockFetch({
        '/v1/me': { status: 200, body: { success: true, data: 'ok' } },
      });
      const client = new ApiClient({
        baseUrl: 'http://api.test/v1',
        fetch,
        getAuthToken: () => 'jwt-xyz',
      });
      await client.get('/me');
      expect(calls[0]!.headers.authorization).toBe('Bearer jwt-xyz');
    });

    it('forwards AbortSignal', async () => {
      const controller = new AbortController();
      const client = new ApiClient({
        baseUrl: 'http://api.test/v1',
        fetch: (_input, init) => {
          // The signal should be present and aborted on cancellation.
          expect(init?.signal).toBeInstanceOf(AbortSignal);
          return Promise.resolve(new Response('{"success":true,"data":1}', { status: 200 }));
        },
      });
      await client.get('/x', { signal: controller.signal });
    });
  });
});
