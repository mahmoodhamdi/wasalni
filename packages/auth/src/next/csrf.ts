import type { NextRequest } from 'next/server';
import { CSRF_HEADER, CSRF_COOKIE, safeEqual } from '../index';

/**
 * Double-submit CSRF validation. The Route Handler issued a `wasalni.csrf`
 * cookie at login; the client reads it and echoes it back as a header.
 * If the two match (constant-time), the request is genuinely originating
 * from our app — not a cross-origin POST.
 *
 * For GET/HEAD/OPTIONS we don't enforce CSRF (no state change). Browsers
 * also enforce `SameSite=Lax` on our session cookie, which is a second
 * line of defence.
 */
export function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }
  return safeEqual(cookieToken, headerToken);
}
