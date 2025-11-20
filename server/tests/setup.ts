/**
 * Global test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_NAME = 'parrit-test';

// Suppress console logs during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
// };
