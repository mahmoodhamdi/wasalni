import { ApiClient } from '../src/client';

/**
 * Build an in-memory fetch double that returns canned responses by path.
 * The double records every request for assertion.
 */
export interface MockRoute {
  status: number;
  body?: unknown;
  text?: string;
  headers?: Record<string, string>;
}

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export function buildMockFetch(routes: Record<string, MockRoute>): {
  fetch: typeof globalThis.fetch;
  calls: CapturedRequest[];
} {
  const calls: CapturedRequest[] = [];
  const fetcher: typeof globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const path = new URL(url).pathname + new URL(url).search;
    const method = (init?.method ?? 'GET').toUpperCase();

    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((v, k) => {
        headers[k] = v;
      });
    }

    calls.push({
      url,
      method,
      headers,
      body: typeof init?.body === 'string' ? init.body : undefined,
    });

    // Try exact path match, then path-only (strip query).
    const route = routes[path] ?? routes[new URL(url).pathname] ?? routes['*'];
    if (!route) {
      return new Response('Not found in mocks', { status: 404 });
    }
    // 204 No Content: Response constructor forbids any body.
    if (route.status === 204) {
      return new Response(null, { status: 204, headers: route.headers ?? {} });
    }
    const body = route.text ?? (route.body !== undefined ? JSON.stringify(route.body) : '');
    return new Response(body, {
      status: route.status,
      headers: {
        'content-type': 'application/json',
        ...(route.headers ?? {}),
      },
    });
  };
  return { fetch: fetcher, calls };
}

export function buildClient(routes: Record<string, MockRoute>): {
  client: ApiClient;
  calls: CapturedRequest[];
} {
  const { fetch, calls } = buildMockFetch(routes);
  const client = new ApiClient({
    baseUrl: 'http://api.test/v1',
    fetch,
  });
  return { client, calls };
}
