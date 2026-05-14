'use client';

import { CSRF_HEADER } from '../index';
import { useAuthStore, type WasalniUser } from './store';

export interface UseAuth {
  user: WasalniUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  /** Logs the user out via the local Route Handler. */
  logout: () => Promise<void>;
  /**
   * Fetch wrapper that includes credentials and the CSRF header on
   * state-changing methods. Use this for all calls to /api/* from the
   * client.
   */
  fetcher: typeof fetch;
}

export function useAuth(): UseAuth {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const csrfToken = useAuthStore((s) => s.csrfToken);
  const setUser = useAuthStore((s) => s.setUser);

  const fetcher: typeof fetch = async (input, init = {}) => {
    const method = (init.method ?? 'GET').toUpperCase();
    const needsCsrf = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    const headers = new Headers(init.headers ?? {});
    if (needsCsrf && csrfToken) {
      headers.set(CSRF_HEADER, csrfToken);
    }
    return fetch(input, { ...init, headers, credentials: 'include' });
  };

  const logout = async (): Promise<void> => {
    await fetcher('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return {
    user,
    isAuthenticated: user !== null,
    isHydrated,
    logout,
    fetcher,
  };
}
