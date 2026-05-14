'use client';

import * as React from 'react';

/**
 * Lightweight wrapper around the Firebase Web SDK push flow. The Firebase
 * deps are lazy-imported so apps that don't have FCM env vars don't pull
 * the SDK into their bundle.
 *
 * Wire-up (per app):
 *   1. Add `firebase` to the app's dependencies.
 *   2. Provide all NEXT_PUBLIC_FIREBASE_* env vars including
 *      NEXT_PUBLIC_FIREBASE_VAPID_KEY.
 *   3. Place /public/firebase-messaging-sw.js (importScripts the firebase-app
 *      and firebase-messaging compat scripts). Reading the app config from
 *      ?config query params lets you keep secrets out of the file.
 *
 * The hook surfaces:
 *   isSupported   – browser has Push + ServiceWorker + Notifications APIs
 *   permission    – 'default' | 'granted' | 'denied'
 *   token         – the FCM registration token once granted, else null
 *   request()     – prompts the user for notification permission; on grant
 *                   fetches the token and exposes it
 *   reset()       – clear local token cache (call on logout)
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

export interface UseFcm {
  isSupported: boolean;
  permission: NotificationPermission | 'unknown';
  token: string | null;
  loading: boolean;
  error: string | null;
  request: () => Promise<string | null>;
  reset: () => void;
}

export function useFcm(config: FirebaseConfig | null): UseFcm {
  const [permission, setPermission] = React.useState<NotificationPermission | 'unknown'>('unknown');
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isSupported = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'
    );
  }, []);

  React.useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const request = React.useCallback(async (): Promise<string | null> => {
    if (!isSupported || !config) {
      setError('not-supported');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await Notification.requestPermission();
      setPermission(next);
      if (next !== 'granted') {
        return null;
      }
      // Lazy-import firebase so apps without config never load the SDK.
      const [{ initializeApp, getApps }, { getMessaging, getToken }] = await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ]);
      const app = getApps().length ? getApps()[0]! : initializeApp(config);
      const messaging = getMessaging(app);
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const t = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: reg,
      });
      if (!t) {
        setError('no-token');
        return null;
      }
      setToken(t);
      return t;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'fcm-failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isSupported, config]);

  const reset = React.useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  return { isSupported, permission, token, loading, error, request, reset };
}
