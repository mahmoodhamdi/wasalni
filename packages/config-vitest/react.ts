import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Shared Vitest base for React component tests using @testing-library/react.
 * Sets up jsdom + the React SWC plugin and provides global expect
 * matchers from @testing-library/jest-dom.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/index.ts',
        'src/**/index.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
});
