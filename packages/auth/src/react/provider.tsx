'use client';

import * as React from 'react';
import { CSRF_COOKIE } from '../index';
import { useAuthStore, type WasalniUser } from './store';

interface AuthProviderProps {
  /** Optional initial user from a server component (skips the /me fetch). */
  initialUser?: WasalniUser | null;
  children: React.ReactNode;
}

/**
 * Hydrates the auth store on mount:
 *   1. Reads the csrf token from `document.cookie`.
 *   2. If no initialUser was provided, fetches `GET /api/auth/me`.
 * Both apps wrap their `<html>` body in this; routes that need auth then
 * use the `useAuth()` hook.
 */
export function AuthProvider({ initialUser = null, children }: AuthProviderProps): React.ReactNode {
  const setUser = useAuthStore((s) => s.setUser);
  const setCsrf = useAuthStore((s) => s.setCsrf);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const cookies = Object.fromEntries(
      document.cookie.split(';').map((c) => {
        const [k, ...rest] = c.trim().split('=');
        return [k ?? '', decodeURIComponent(rest.join('='))];
      }),
    );
    setCsrf(cookies[CSRF_COOKIE] ?? null);

    if (initialUser) {
      setUser(initialUser);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const body = (await res.json()) as { data?: WasalniUser };
          setUser(body.data ?? null);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initialUser, setUser, setCsrf, setHydrated]);

  return <>{children}</>;
}
