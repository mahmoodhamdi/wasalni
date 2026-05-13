'use client';

import * as React from 'react';

/**
 * Detects when a new service worker has finished installing in the
 * background. Returns:
 *  - hasUpdate: a new SW is waiting to take over
 *  - apply(): tells the waiting SW to skipWaiting and reloads the page
 *  - dismiss(): hides the prompt until the next update
 */

export interface UseSwUpdate {
  hasUpdate: boolean;
  apply: () => Promise<void>;
  dismiss: () => void;
}

export function useServiceWorkerUpdate(): UseSwUpdate {
  const [hasUpdate, setHasUpdate] = React.useState(false);
  const waitingRef = React.useRef<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    const onStateChange = (sw: ServiceWorker) => {
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          waitingRef.current = sw;
          if (!cancelled) setHasUpdate(true);
        }
      });
    };

    navigator.serviceWorker.ready.then((reg) => {
      if (cancelled) return;
      if (reg.waiting) {
        waitingRef.current = reg.waiting;
        setHasUpdate(true);
      }
      reg.addEventListener('updatefound', () => {
        if (reg.installing) onStateChange(reg.installing);
      });
    });

    const onControllerChange = () => {
      // The new SW took over — reload to use the fresh code.
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const apply = React.useCallback(async () => {
    const w = waitingRef.current;
    if (!w) return;
    w.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  const dismiss = React.useCallback(() => {
    setHasUpdate(false);
  }, []);

  return { hasUpdate, apply, dismiss };
}
