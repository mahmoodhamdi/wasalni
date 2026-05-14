import type { MetadataRoute } from 'next';

/**
 * Driver PWA manifest. Differs from the passenger manifest in name,
 * shortcuts, and (eventually) a different colour. Same start_url logic.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'وصلني للسواق',
    short_name: 'وصلني سائق',
    description: 'اشتغل وقتك أنت، واكسب من بلدك',
    start_url: '/ar',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#073847',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
    categories: ['business', 'travel', 'productivity'],
    shortcuts: [
      {
        name: 'أرباحي',
        short_name: 'أرباح',
        url: '/ar/earnings',
        description: 'افتح شاشة الأرباح فوراً',
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
