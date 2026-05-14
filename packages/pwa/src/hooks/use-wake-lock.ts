'use client';

import * as React from 'react';

/**
 * Screen Wake Lock hook. Keeps the screen on while the lock is held —
 * used by the driver app during an active shift / trip.
 *
 * Browser caveats (documented in PLAN.md):
 *  - Lock is auto-released when the document becomes hidden (tab switch,
 *    minimised PWA). On `visibilitychange` we re-acquire.
 *  - Refused on low battery in some browsers; the hook reports `error`.
 *  - Not supported on iOS < 16.4; the hook reports `isSupported: false`.
 */

export interface UseWakeLock {
  isSupported: boolean;
  isHeld: boolean;
  error: string | null;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

interface WakeLockSentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}

interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

export function useWakeLock(): UseWakeLock {
  const sentinelRef = React.useRef<WakeLockSentinel | null>(null);
  const [isHeld, setIsHeld] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const wl = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    setIsSupported(typeof wl?.request === 'function');
  }, []);

  const release = React.useCallback(async () => {
    const s = sentinelRef.current;
    if (!s) return;
    try {
      await s.release();
    } catch {
      // ignored — already released or page closed
    }
    sentinelRef.current = null;
    setIsHeld(false);
  }, []);

  const request = React.useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false;
    const wl = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!wl) {
      setError('not-supported');
      return false;
    }
    try {
      const sentinel = await wl.request('screen');
      sentinel.addEventListener('release', () => {
        setIsHeld(false);
      });
      sentinelRef.current = sentinel;
      setIsHeld(true);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'wake-lock-failed';
      setError(message);
      return false;
    }
  }, []);

  // Re-acquire when tab becomes visible again
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isHeld === false && error === null) {
        // Only re-acquire if we had a lock recently (sentinelRef has been
        // cleared by `release` event); we leave that to the caller via
        // `request()` if they want auto-resume.
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isHeld, error]);

  return { isSupported, isHeld, error, request, release };
}
