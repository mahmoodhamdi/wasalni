import nextConfig from '@wasalni/config-eslint/next.js';

/** Next.js's own config plugin is consumed via `next lint`, not flat config. */
export default [
  ...nextConfig,
  {
    ignores: ['.next/**', '.turbo/**', 'node_modules/**', 'public/**'],
  },
];
