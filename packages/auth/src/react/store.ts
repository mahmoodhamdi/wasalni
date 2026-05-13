'use client';

import { create } from 'zustand';
import type { IDriver, IPassenger } from '@wasalni/shared-types';

export type WasalniUser = IPassenger | IDriver;

interface AuthState {
  user: WasalniUser | null;
  csrfToken: string | null;
  isHydrated: boolean;
  setUser: (user: WasalniUser | null) => void;
  setCsrf: (token: string | null) => void;
  setHydrated: (b: boolean) => void;
}

/**
 * Client-side auth store. Hydrated by the AuthProvider on mount via
 * `GET /api/auth/me`. The store holds the user profile (not the JWT —
 * the JWT lives in an httpOnly cookie inaccessible to JS).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  csrfToken: null,
  isHydrated: false,
  setUser: (user) => set({ user }),
  setCsrf: (token) => set({ csrfToken: token }),
  setHydrated: (b) => set({ isHydrated: b }),
}));
