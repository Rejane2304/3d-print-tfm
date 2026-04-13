# Test Database Safety Guide

## ⚠️ Safety First

This test suite is designed with **mandatory safety checks** to prevent accidental execution against production databases.

## Overview

The test framework implements multiple layers of protection:

1. **Mandatory Database Validation** - Cannot be skipped
2. **Automatic Transaction Rollback** - Test data never persists
3. **Environment Isolation** - Tests require `NODE_ENV=test`
4. **Database Name Validation** - Must contain "test"

## Safety Measures

### 1. Database Validation (Mandatory)

Before any database operation, the framework validates:

- ✅ `NODE_ENV` is set to `"test"`
- ✅ `DATABASE_URL` points to a test database
- ✅ Database name contains "test" (case insensitive)
- ✅ URL doesn't contain production patterns (e.g., `/postgres?`)

**If validation fails, tests will throw a FATAL ERROR and stop immediately.**

```typescript
import { validateTestDB } from './helpers';

// This will throw if not in test environment
await validateTestDB();
```

### 2. Transaction Rollback

Each test is automatically wrapped in a transaction that rolls back after completion. This ensures **zero data pollution**.

#### Using `withTestTransaction()`

```typescript
import { withTestTransaction } from './helpers';

// Wrap a single test
it(
  'should create a user',
  withTestTransaction(async tx => {
    const user = await tx.user.create({
      data: { email: 'test@test.com', name: 'Test User' },
    });

    expect(user.email).toBe('test@test.com');
    // Transaction rolls back automatically - user never saved
  }),
);
```

#### Using with beforeEach

```typescript
import { withTestTransaction, cleanupDB } from './helpers';

describe('User API', () => {
  // Fresh data for each test
  beforeEach(
    withTestTransaction(async tx => {
      await tx.user.create({ data: { email: 'setup@test.com' } });
    }),
  );

  it('has isolated data', async () => {
    // Each test starts fresh with data from beforeEach
    // All changes roll back after the test
  });
});
```

### 3. Database Reset

For complete test isolation between suites, use `resetTestDatabase()`:

```typescript
import { resetTestDatabase } from './helpers';

beforeAll(async () => {
  await resetTestDatabase();
});
```

This will:

- Validate the test database
- Truncate all tables in dependency order
- Reset sequences
- Seed minimal test data

### 4. Cleanup Between Tests

```typescript
import { cleanupDB } from './helpers';

afterEach(async () => {
  await cleanupDB({ verbose: true });
});
```

## Configuration

### Required Environment Variables

Create a `.env.test` file (copy from `.env.test.example`):

```bash
# MANDATORY: Must be "test"
NODE_ENV="test"

# MANDATORY: Database name MUST contain "test"
DATABASE_URL=postgresql://user:pass@localhost:5433/myapp_test

# Optional: Control test behavior
TEST_PERSISTENCE=false  # Set to true to disable rollback (NOT recommended)
```

### Database Naming Requirements

✅ **Valid database names:**

- `myapp_test`
- `TEST_DATABASE`
- `3dprint_tfm_test`

❌ **Invalid database names (will fail validation):**

- `myapp` (no "test")
- `postgres` (production pattern)
- `production` (production pattern)

## Running Tests

### Safe Commands

```bash
# Run unit tests (no database)
npm run test:unit

# Run integration tests (with database)
npm run test:integration

# Run all tests
NODE_ENV=test npm run test
```

### Commands That Will Fail

```bash
# ❌ Missing NODE_ENV
npm run test

# ❌ Wrong NODE_ENV
NODE_ENV=development npm run test

# ❌ Production database
DATABASE_URL=postgresql://.../production NODE_ENV=test npm run test
```

## Troubleshooting

### Error: "NODE_ENV must be 'test'"

**Cause:** Running tests without `NODE_ENV=test`

**Solution:**

```bash
NODE_ENV=test npm run test
```

### Error: "DATABASE_NAME MUST CONTAIN 'test'"

**Cause:** Database URL doesn't have "test" in the database name

**Solution:**

1. Create a test database with "test" in the name
2. Update `.env.test`:
   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5433/myapp_test
   ```

### Error: "PRODUCTION DATABASE DETECTED"

**Cause:** URL matches production patterns

**Solution:**

- Don't use default Supabase URLs (`/postgres?`)
- Use a dedicated test database
- Ensure URL contains "test" in database name

### Tests Not Rolling Back

**Cause:** Test not wrapped in transaction

**Solution:**
Use `withTestTransaction()` or ensure `TEST_PERSISTENCE` is not set:

```typescript
// ❌ Without transaction - data persists
it('test', async () => {
  await prisma.user.create({ data: {...} });
});

// ✅ With transaction - data rolls back
it('test', withTestTransaction(async (tx) => {
  await tx.user.create({ data: {...} });
}));
```

## Architecture

### Transaction Flow

```
Test Start
    │
    ▼
┌─────────────────────┐
│  BEGIN TRANSACTION  │
│  (auto-rollback)    │
├─────────────────────┤
│  Run test code      │
│  using tx client    │
├─────────────────────┤
│  ROLLBACK           │
│  (on success/error) │
└─────────────────────┘
    │
    ▼
Test Complete (data cleaned)
```

### Validation Flow

```
Test Start
    │
    ▼
┌─────────────────────┐
│  Check NODE_ENV     │
│  Must be "test"     │
├─────────────────────┤
│  Check DATABASE_URL │
│  Must contain "test"│
├─────────────────────┤
│  Check for prod     │
│  patterns           │
├─────────────────────┤
│  ✓ All checks pass  │
│  → Run test         │
└─────────────────────┘
```

## Best Practices

### 1. Always Use Transaction Wrapper

```typescript
// ✅ Good
it('creates user', withTestTransaction(async (tx) => {
  const user = await tx.user.create({...});
  expect(user).toBeDefined();
}));

// ❌ Bad
it('creates user', async () => {
  const user = await prisma.user.create({...}); // Persists!
  expect(user).toBeDefined();
});
```

### 2. Use Correct Prisma Client

```typescript
// ✅ Inside transaction - use tx
withTestTransaction(async (tx) => {
  await tx.user.create({...});
});

// ❌ Mixing clients - don't do this
withTestTransaction(async (tx) => {
  await prisma.user.create({...}); // Bypasses transaction!
});
```

### 3. Handle Test Data Properly

```typescript
// ✅ Seed in beforeAll with reset
beforeAll(async () => {
  await resetTestDatabase();
});

// ✅ Or use transactions for test-specific data
beforeEach(withTestTransaction(async (tx) => {
  await tx.user.create({...});
}));
```

### 4. Validate Database Before Operations

```typescript
// ✅ Explicit validation
import { validateTestDB } from './helpers';

beforeAll(async () => {
  await validateTestDB(); // Throws if unsafe
  // ... proceed with tests
});
```

## Helper Functions Reference

### `validateTestDB()`

Validates database safety. **Mandatory** - throws if checks fail.

### `validateTestDBSync()`

Synchronous validation for immediate feedback.

### `withTestTransaction(testFn, options?)`

Wraps test in auto-rollback transaction.

### `cleanupDB(options?)`

Truncates all tables. Use for cleanup.

### `resetTestDatabase()`

Complete database reset with seeding.

### `getDBInfo()`

Returns database information (safe, read-only).

### `isTestEnvironment()`

Quick check if running in test environment.

## Safety Checklist

Before running tests:

- [ ] `.env.test` file exists
- [ ] `NODE_ENV=test` is set
- [ ] `DATABASE_URL` points to test database
- [ ] Database name contains "test"
- [ ] Not using production credentials
- [ ] Test database is running (for integration tests)

## Contact

If you encounter issues:

1. Check this README first
2. Review error messages carefully
3. Verify your `.env.test` configuration
4. Ensure database name contains "test"

**Remember: These safety measures exist to protect your production data.**
