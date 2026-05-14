/**
 * Session/CSRF constants and types shared by the passenger and driver web
 * apps. Implementation glue (cookies-jar reads/writes via `next/headers`)
 * lives inside each app to avoid pulling Next.js into this package.
 */

import type { IDriver, IPassenger } from '@wasalni/shared-types';

/** httpOnly cookie name carrying the backend-issued JWT. */
export const SESSION_COOKIE = 'wasalni.session';

/** Non-httpOnly cookie holding the CSRF double-submit token. */
export const CSRF_COOKIE = 'wasalni.csrf';

/** Header expected on state-changing Route Handler calls. */
export const CSRF_HEADER = 'x-wasalni-csrf';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches backend JWT TTL

export interface SessionPayload {
  user: IPassenger | IDriver;
  /** Unix seconds when the JWT expires. */
  exp: number;
}

export type UnauthenticatedSession = { authenticated: false };
export type AuthenticatedSession = { authenticated: true } & SessionPayload;
export type Session = UnauthenticatedSession | AuthenticatedSession;

/**
 * Cryptographically random token for the double-submit cookie. Browser-safe
 * (no Node crypto import). Server-side callers may pass `crypto.randomUUID()`
 * — both produce 36-byte strings that are good enough for CSRF.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison to avoid CSRF token timing leaks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return acc === 0;
}
