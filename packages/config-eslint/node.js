import globals from 'globals';
import base from './base.js';

/**
 * Node.js library/server flat config: base + Node globals.
 */
export default [
  ...base,
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
