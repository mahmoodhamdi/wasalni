import type { MetadataRoute } from 'next';

/**
 * Web App Manifest served at /manifest.webmanifest by Next 16.
 * Default language is Arabic; clients negotiate.
 *
 * Icons reference both the static SVG (vector, scales to any size) and the
 * dynamically-generated PNG from `app/apple-icon.tsx`. Explicit raster
 * sizes (192/512/maskable PNGs) are added alongside the production deploy
 * pipeline in PR 21.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'وصلني',
    short_name: 'وصلني',
    description: 'احجز رحلتك من البلد وللبلد',
    start_url: '/ar',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#0b6b7c',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
    categories: ['travel', 'navigation', 'lifestyle'],
    shortcuts: [
      {
        name: 'احجز رحلة',
        short_name: 'احجز',
        url: '/ar/book',
        description: 'افتح شاشة الحجز فوراً',
      },
      {
        name: 'رحلاتي',
        short_name: 'رحلات',
        url: '/ar/trips',
      },
    ],
    prefer_related_applications: false,
  };
}
