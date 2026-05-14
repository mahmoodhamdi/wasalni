import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip every internal route and any path with a file extension. The locale
  // middleware itself handles `/` → `/<defaultLocale>`.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
