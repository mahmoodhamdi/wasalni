import react from './react.js';

/**
 * Next.js flat config: react config plus Next.js-specific overrides.
 * Apps consuming this also extend `eslint-config-next` directly in their
 * own `eslint.config.js` (the official package isn't fully flat-config
 * yet so it has to be wired up per-app via `next lint`).
 */
export default [
  ...react,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Server Components: console.log is fine on the server, warn only on the client
      'no-console': 'off',
    },
  },
];
