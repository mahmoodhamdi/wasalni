/**
 * Next.js server-side helpers for the session cookie. Use these inside
 * Route Handlers and Server Components — they call `cookies()` from
 * `next/headers`, which only works on the server.
 */

import { cookies } from 'next/headers';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { SESSION_COOKIE, CSRF_COOKIE, SESSION_MAX_AGE_SECONDS, generateCsrfToken } from '../index';

const baseCookieOptions: Partial<ResponseCookie> = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Set the session JWT in an httpOnly cookie, and a matching readable CSRF
 * token. The CSRF cookie is read by the client and echoed back as an
 * `X-Wasalni-Csrf` header on state-changing requests (double-submit
 * pattern; validated by `validateCsrf` in this directory).
 */
export async function setSession(jwt: string): Promise<string> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  const csrf = generateCsrfToken();
  jar.set(CSRF_COOKIE, csrf, {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return csrf;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function getCsrfToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(CSRF_COOKIE)?.value;
}
