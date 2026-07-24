# Trip-Sync Test Suite

This directory contains the automated test suite for Trip-Sync.

## Test Structure

```
tests/
├── setup.ts                 # Test configuration and global setup
├── auth.test.ts            # Authentication unit tests
├── middleware.test.ts      # Middleware unit tests
├── storage.test.ts         # Storage/data model tests
├── api/
│   └── auth.api.test.ts    # Auth API integration tests
└── helpers/
    └── testApp.ts          # Test utilities and helpers
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Coverage Requirements

The project maintains a minimum test coverage of 70% for:

- Lines
- Functions
- Branches
- Statements

Current coverage can be viewed by running `npm run test:coverage`.

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or modules in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../server/auth';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
});
```

### Integration Tests

Integration tests verify API endpoints and multiple components working together:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(response.body).toHaveProperty('token');
  });
});
```

## Test Environment

Tests run in a separate environment with:

- `NODE_ENV=test`
- In-memory database (no PostgreSQL required)
- Isolated test data
- Mock external services (AI, Stripe, etc.)

## Configuration

Test configuration is defined in:

- `vitest.config.ts` - Vitest test runner configuration
- `tests/setup.ts` - Global test setup and teardown
- `.env.test` - Test environment variables

## Best Practices

1. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
2. **Test Independence**: Each test should run independently without relying on other tests
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Mock External Dependencies**: Don't make real API calls or database connections in unit tests
5. **Test Edge Cases**: Include tests for error conditions, boundary values, and edge cases
6. **Keep Tests Fast**: Unit tests should run in milliseconds, integration tests in seconds

## Continuous Integration

Tests are automatically run on every commit via GitHub Actions. Pull requests must pass all tests before merging.

## Debugging Tests

To debug a specific test:

```bash
# Run a specific test file
npm test auth.test

# Run tests matching a pattern
npm test -- --grep="password"

# Run with verbose output
npm test -- --reporter=verbose
```

## Adding New Tests

When adding new features:

1. Write tests first (TDD approach) or alongside the feature
2. Ensure new code maintains 70%+ coverage
3. Add integration tests for API endpoints
4. Add unit tests for business logic
5. Update this README if adding new test categories

## Test Coverage Goals

Current status: **61 tests passing**

Coverage targets by module:

- ✅ Authentication: 70%+ (auth.ts)
- ✅ Middleware: 42% (middleware.ts) - needs more tests
- ⚠️ Storage: 0.3% (storage.ts, storage-pg.ts) - needs integration tests
- ⚠️ Routes: Not yet tested - high priority
- ⚠️ AI Service: Not yet tested
- ⚠️ Stripe Service: Not yet tested

Next priorities:

1. Add storage integration tests with test database
2. Add routes integration tests for critical paths
3. Add mock tests for AI service
4. Add mock tests for Stripe webhook handling
