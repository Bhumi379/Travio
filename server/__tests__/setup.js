/**
 * Jest Setup File
 * Runs before all tests
 */

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
// };

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/travio-test';
process.env.PORT = 5001;
process.env.TOKEN_KEY = 'test-secret-key-for-testing-only';
process.env.ADMIN_JWT_SECRET = 'test-admin-secret-key-for-testing-only';

// Cleanup after all tests
afterAll(async () => {
  // Close any remaining connections
  await new Promise(resolve => setTimeout(resolve, 500));
});
