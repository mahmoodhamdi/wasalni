import nextConfig from '@wasalni/config-eslint/next.js';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', '.turbo/**', 'node_modules/**', 'public/**'],
  },
];
