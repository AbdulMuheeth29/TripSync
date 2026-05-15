import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long-for-testing';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/tripsync_test';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Clean up after each test
afterEach(() => {
  // Reset mocks, clear timers, etc.
});

// Global test teardown
afterAll(() => {
  console.log('✅ Test suite completed');
});
