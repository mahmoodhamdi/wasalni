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

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

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
    return [
      // Serve the Serwist-built /sw.js via a Route Handler because Next 16
      // doesn't reliably serve runtime-generated .js files from public/
      // alongside the catch-all [locale] segment.
      { source: '/sw.js', destination: '/api/sw' },
    ];
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
            // Driver app needs geolocation + screen-wake-lock + notifications.
            value:
              'geolocation=(self), microphone=(), camera=(self), payment=(), display-capture=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withSerwist(withNextIntl(config));
