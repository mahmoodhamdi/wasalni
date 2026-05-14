import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  transpilePackages: [
    '@wasalni/api-client',
    '@wasalni/auth',
    '@wasalni/i18n',
    '@wasalni/schemas',
    '@wasalni/shared-types',
    '@wasalni/socket-client',
    '@wasalni/ui',
    '@wasalni/utils',
  ],

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

export default withNextIntl(config);
