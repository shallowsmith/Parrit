import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable globals like describe, it, expect without imports
    globals: true,

    // Node environment for Express API testing
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',              // Faster than istanbul
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/types/**',
        'src/index.ts',            // Main entry point
        'src/config/swagger.ts'    // Swagger config
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },

    // Setup files to run before tests
    setupFiles: ['./tests/setup.ts'],

    // Timeout for tests (10 seconds)
    testTimeout: 10000,

    // Run tests in parallel
    pool: 'threads',

    // Isolate tests in separate threads
    isolate: true
  },

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
