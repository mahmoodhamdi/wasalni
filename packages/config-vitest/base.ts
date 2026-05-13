import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest base for pure-TS packages (no React, no JSX).
 * Coverage thresholds are tight on logic-heavy code; relax per-package
 * when wrapping native APIs that can't be unit-tested cleanly.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.d.ts', 'src/**/types.ts', '**/node_modules/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
