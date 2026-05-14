'use client';

import * as React from 'react';

export interface GeolocationState {
  /** Current coordinates, or null until first fix. */
  coords: { latitude: number; longitude: number; accuracy: number } | null;
  /** Compass bearing in degrees, when available. */
  heading: number | null;
  /** Speed in m/s, when available. */
  speed: number | null;
  /** Most recent positioning error. */
  error: GeolocationPositionError | null;
  /** Permission state, when reported by the browser. */
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  /** True once watchPosition has emitted at least once. */
  hasFix: boolean;
}

export interface UseGeolocationOptions {
  /** Continuously watch (default) or get a single fix. */
  watch?: boolean;
  /** Forwarded to PositionOptions. */
  enableHighAccuracy?: boolean;
  /** Forwarded to PositionOptions. */
  maximumAge?: number;
  /** Forwarded to PositionOptions. */
  timeout?: number;
  /** Auto-start on mount (default true). */
  autoStart?: boolean;
}

/**
 * Wraps navigator.geolocation with React state. Returns the latest fix,
 * heading/speed when the browser provides them, and a hand-rolled
 * permission probe via the Permissions API.
 *
 * On the driver side this powers the live-location stream we forward to
 * the backend via Socket.io. On the passenger side it centres the booking
 * map on the user.
 */
export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & {
  start: () => void;
  stop: () => void;
} {
  const {
    watch = true,
    enableHighAccuracy = true,
    maximumAge = 5_000,
    timeout = 10_000,
    autoStart = true,
  } = options;

  const [state, setState] = React.useState<GeolocationState>({
    coords: null,
    heading: null,
    speed: null,
    error: null,
    permission: 'unknown',
    hasFix: false,
  });

  const watchIdRef = React.useRef<number | null>(null);

  const handleSuccess = React.useCallback((pos: GeolocationPosition) => {
    setState((prev) => ({
      ...prev,
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      },
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      error: null,
      hasFix: true,
    }));
  }, []);

  const handleError = React.useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({ ...prev, error: err }));
  }, []);

  const start = React.useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return;
    const opts: PositionOptions = { enableHighAccuracy, maximumAge, timeout };
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, opts);
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, opts);
    }
  }, [watch, enableHighAccuracy, maximumAge, timeout, handleSuccess, handleError]);

  const stop = React.useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Probe the permission state, if the API is available.
  React.useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      typeof (navigator as Navigator).permissions === 'undefined'
    ) {
      return;
    }
    let cancelled = false;
    (navigator as Navigator).permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          permission: status.state as GeolocationState['permission'],
        }));
        status.addEventListener('change', () => {
          setState((prev) => ({
            ...prev,
            permission: status.state as GeolocationState['permission'],
          }));
        });
      })
      .catch(() => {
        // Permissions API unavailable; leave as 'unknown'.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  return { ...state, start, stop };
}
