# Testing Guide - 3D Print TFM

## 🚀 Commands

### Run Tests

```bash
# All tests
npm test

# Unit tests (validation, components)
npm run test:unit

# Integration tests (APIs, database) - Requires PostgreSQL
npm run test:integration

# E2E tests (full flows) - Requires server running
npm run test:e2e

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

---

## 🔧 Configuration

### Vitest (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    testTimeout: 10000,
  },
})
```

### Playwright (`playwright.config.ts`)

See `playwright.config.ts` for browser and device configuration.

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

```bash
# Check that Docker is running
1. Add `await` where missing

# If not running:
2. Verify DB cleanup between tests

# Wait 5 seconds and retry
sleep 5 && npm run test:integration
```

### Error: "Cannot find module '@/lib/db/prisma'"

```bash
# Check that path alias is configured
# In vitest.config.ts you should have:
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

### Flaky Tests

If a test fails randomly:
1. Add `await` where missing
2. Check DB cleanup between tests
3. Increase timeout if needed: `it('...', async () => { ... }, 15000)`

---

## 📊 Coverage

### Current Metrics (Goal)

| Type | Current Tests | Goal | Status |
|------|---------------|------|--------|
| Unit | ~25 | 60+ | 🟡 In progress |
| Integration | ~290 | ~100 (focused) | 🟡 Consolidating |
| E2E | 19 | 60+ | 🔴 Pending |

### View Coverage

```bash
npm run test:coverage
# Open coverage/index.html
```

---

## 🎯 Best Practices

### ✅ Do

- **Test behavior**, not implementation
- **One assert per test** (ideally)
- **Descriptive names**: `it('should return 401 when unauthenticated')`
- **Clean up after**: use `afterEach` or `afterAll` to clean DB
- **Predictable test data**: use fixed IDs, not random

### ❌ Don't

- Don't test internal implementation (changing implementation shouldn't break tests)
- Don't use arbitrary `setTimeout` to "wait"
- Don't hardcode production IDs
- Don't leave tests with `expect(true).toBe(true)` (placeholders)
- Don't repeat validation tests in 3 layers (unit, integration, E2E)

---

## 📝 Adding New Tests

### Step 1: Decide the Type

- **Is it pure logic?** → `tests/unit/`
- **Uses database or APIs?** → `tests/integration/`
- **Is it a full user flow?** → `tests/e2e/`

### Step 2: Create the File

```bash
# Unit
touch tests/unit/my-feature.test.ts

# Integration
touch tests/integration/api/my-endpoint.test.ts

# E2E
touch tests/e2e/my-flow.spec.ts
```

### Step 3: Write the Test

See examples in "Conventions" above.

### Step 4: Run and Verify

```bash
npm run test:unit -- tests/unit/my-feature.test.ts
```

---

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Last updated:** April 2, 2026  
**Maintainer:** 3D Print TFM Team