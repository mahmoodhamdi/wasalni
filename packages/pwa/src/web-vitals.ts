'use client';

/**
 * Browser-side Web Vitals reporter. Subscribes to LCP, INP, CLS, TTFB, FCP
 * via the `web-vitals` package (lazy-imported so unused apps don't pay
 * the bundle cost) and POSTs every metric to a configurable endpoint —
 * typically `/api/metrics` on the same app, which then forwards to a
 * real observability backend (Sentry / OTel collector / your own).
 *
 * Send strategy: `navigator.sendBeacon` when available (survives page
 * unload), `fetch(keepalive: true)` otherwise.
 */

export interface WebVitalsEvent {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  app: string;
  path: string;
  ts: number;
}

export async function reportWebVitals(app: string, endpoint = '/api/metrics'): Promise<void> {
  if (typeof window === 'undefined') return;
  let mod: typeof import('web-vitals');
  try {
    mod = await import('web-vitals');
  } catch {
    return; // web-vitals not installed in this app — silently skip
  }

  const post = (event: WebVitalsEvent): void => {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        return;
      } catch {
        // fall through
      }
    }
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {
      // metrics best-effort; never let reporting break the page
    });
  };

  const handle = (metric: import('web-vitals').Metric) => {
    post({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType ?? 'navigate',
      app,
      path: window.location.pathname,
      ts: Date.now(),
    });
  };

  mod.onCLS(handle);
  mod.onINP(handle);
  mod.onLCP(handle);
  mod.onFCP(handle);
  mod.onTTFB(handle);
}
