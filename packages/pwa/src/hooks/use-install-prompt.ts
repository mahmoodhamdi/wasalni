'use client';

import * as React from 'react';

/**
 * Captures the `beforeinstallprompt` event so the app can offer a custom
 * install card instead of relying on the browser-default banner.
 *
 * Returns:
 *  - canInstall: true once the browser has fired beforeinstallprompt and
 *    the user hasn't dismissed/installed yet
 *  - install(): prompts the user; resolves to 'accepted' | 'dismissed' |
 *    'unavailable'
 *  - dismiss(): hides the prompt for this session (sessionStorage)
 *
 * Safari/iOS never fire beforeinstallprompt — they require the user to
 * tap "Add to Home Screen" manually. Callers should still surface their
 * own install hint based on UA detection for iOS Safari (see the
 * `isStandalone` helper).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

const DISMISS_KEY = 'wasalni.install.dismissed';

export interface UsePwaInstall {
  canInstall: boolean;
  isStandalone: boolean;
  install: () => Promise<InstallOutcome>;
  dismiss: () => void;
}

export function useInstallPrompt(): UsePwaInstall {
  const deferredRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone (already installed)
    const mql = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () =>
      setIsStandalone(
        mql.matches ||
          // iOS Safari sets navigator.standalone on the home-screen instance
          (window.navigator as { standalone?: boolean }).standalone === true,
      );
    updateStandalone();
    mql.addEventListener('change', updateStandalone);

    const handler = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      e.preventDefault();
      deferredRef.current = e;
      // Honour a prior dismiss in this session
      if (sessionStorage.getItem(DISMISS_KEY) !== '1') {
        setCanInstall(true);
      }
    };

    const onInstalled = () => {
      deferredRef.current = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      mql.removeEventListener('change', updateStandalone);
    };
  }, []);

  const install = React.useCallback(async (): Promise<InstallOutcome> => {
    const event = deferredRef.current;
    if (!event) return 'unavailable';
    await event.prompt();
    const choice = await event.userChoice;
    deferredRef.current = null;
    setCanInstall(false);
    return choice.outcome;
  }, []);

  const dismiss = React.useCallback(() => {
    setCanInstall(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISS_KEY, '1');
    }
  }, []);

  return { canInstall, isStandalone, install, dismiss };
}
