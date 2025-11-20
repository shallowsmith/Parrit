# Testing Guide

This directory contains integration and end-to-end tests for the Parrit API.

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with UI
npm run test:ui
```

## Test Structure

```
tests/
├── integration/        # API endpoint tests with real HTTP requests
├── e2e/               # End-to-end user flow tests
└── helpers/           # Shared test utilities
    ├── mongodb-setup.ts    # MongoDB Memory Server helpers
    ├── firebase-mocks.ts   # Firebase Admin SDK mocks
    └── test-data.ts        # Test data factory functions
```

## Writing Tests

### Integration Tests

Integration tests use Supertest to test HTTP endpoints with a real Express app and MongoDB Memory Server.

**Example**: `tests/integration/profile.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, teardownDatabase, clearDatabase } from '../helpers/mongodb-setup';

// Mock Firebase
vi.mock('../../src/config/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
  setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/resource', resourceRoutes);

describe('Resource API', () => {
  beforeAll(async () => await setupDatabase());
  afterAll(async () => await teardownDatabase());
  afterEach(async () => await clearDatabase());

  it('should create a resource', async () => {
    const response = await request(app)
      .post('/api/v1/resource')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Test' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Unit Tests

Unit tests are colocated with source code in `__tests__/` directories.

**Example**: `src/services/__tests__/ServiceName.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../MyService';

// Mock dependencies
vi.mock('../../repositories/MyRepository', () => ({
  MyRepository: vi.fn().mockImplementation(() => ({
    find: vi.fn(),
    create: vi.fn(),
  })),
}));

describe('MyService', () => {
  let service: MyService;
  let mockRepository: any;

  beforeEach(() => {
    service = new MyService();
    mockRepository = (service as any).repository;
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    mockRepository.find.mockResolvedValue({ id: '123' });
    const result = await service.doSomething('123');
    expect(result).toBeDefined();
  });
});
```

## Test Helpers

### MongoDB Setup

```typescript
import { setupDatabase, teardownDatabase, clearDatabase } from '../helpers/mongodb-setup';

beforeAll(async () => await setupDatabase());
afterAll(async () => await teardownDatabase());
afterEach(async () => await clearDatabase());
```

### Firebase Mocks

```typescript
import { mockTokens, mockFirebaseAdmin } from '../helpers/firebase-mocks';
import { verifyIdToken } from '../../src/config/firebase-admin';

// In test
(verifyIdToken as any).mockResolvedValue(mockTokens.validWithUserId);
```

### Test Data Factories

```typescript
import { createTestProfile, createTestTransaction } from '../helpers/test-data';

const profile = createTestProfile({ email: 'custom@example.com' });
const transaction = createTestTransaction(userId, { amount: 100.50 });
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Database**: Use `clearDatabase()` in `afterEach()` for integration tests
3. **Mock External Services**: Always mock Firebase, don't make real API calls
4. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear sections:
   - Arrange: Set up test data and mocks
   - Act: Execute the code being tested
   - Assert: Verify the results
6. **Fast Tests**: Unit tests should be < 100ms, integration tests < 2s
7. **Coverage**: Aim for 80%+ coverage on business logic

## Debugging Tests

```bash
# Run a specific test file
npx vitest run src/services/__tests__/ProfileService.test.ts

# Run tests in watch mode for debugging
npm test

# Use VS Code debugger
# Add breakpoint and run "Debug: JavaScript Debug Terminal"
```

## Common Issues

**MongoDB Memory Server doesn't start**:
- Check if port 27017 is available
- Try clearing MongoDB Memory Server cache: `rm -rf ~/.cache/mongodb-memory-server`

**Firebase mock not working**:
- Ensure `vi.mock()` is called before imports
- Clear mocks with `vi.clearAllMocks()` in `beforeEach()`

**Tests hanging**:
- Ensure `afterAll()` calls `teardownDatabase()`
- Check for unclosed database connections
- Increase timeout with `testTimeout` in vitest.config.ts

## Coverage Reports

Coverage reports are generated in `coverage/` directory after running:

```bash
npm run test:coverage
```

Open `coverage/index.html` in a browser to view detailed coverage report.
