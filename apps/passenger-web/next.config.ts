import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

/**
 * Content Security Policy. Allows what the app actually needs:
 *   - own origin
 *   - inline scripts (Next.js hydration; tighten with nonces in PR 25
 *     once the nonce middleware is wired)
 *   - blob:/data: for icons + map tiles
 *   - OpenFreeMap + OSM tile servers
 *   - Backend HTTP + WS for live trip + Socket.io
 *   - Firebase Cloud Messaging endpoints
 *   - Paymob payment iframe
 */
// In development we let the app talk to the local backend over plain http/ws
// (port 5001 by convention). Production strips these.
const isDev = process.env.NODE_ENV !== 'production';
const devConnect = isDev ? ' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*' : '';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tiles.openfreemap.org https://*.tile.openstreetmap.org https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self' https://tiles.openfreemap.org https://*.tile.openstreetmap.org https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com${devConnect}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'self' https://accept.paymobsolutions.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output (Next 12+) trims node_modules to only what's needed
  // at runtime. The Dockerfile in deploy/ copies the .next/standalone tree
  // for a small final image (~150 MB vs 600+).
  output: 'standalone',
  outputFileTracingRoot: process.env.NEXT_OUTPUT_FILE_TRACING_ROOT,

  transpilePackages: [
    '@wasalni/api-client',
    '@wasalni/auth',
    '@wasalni/i18n',
    '@wasalni/map',
    '@wasalni/pwa',
    '@wasalni/schemas',
    '@wasalni/shared-types',
    '@wasalni/socket-client',
    '@wasalni/ui',
    '@wasalni/utils',
  ],

  async rewrites() {
    return [{ source: '/sw.js', destination: '/api/sw' }];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=(self), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default withSerwist(withNextIntl(config));
