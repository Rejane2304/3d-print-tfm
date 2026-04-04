# Improvement Roadmap - 3D Print TFM

Action plan for the gradual reconstruction of tests and documentation.

---

## ✅ Completed

### Phase 1: Temporary Documentation Cleanup
**Date:** April 2, 2026  
**Status:** ✅ COMPLETED

**Achievements:**
- ✅ Removed 19 temporary documentation files
- ✅ Clean project root
- ✅ Created docs/TESTING.md (single guide)
- ✅ Created docs/ROADMAP.md (this document)

**Files removed:**
- AUDIT_*.md (5 files)
- TEST_ANALYSIS_*.md (4 files)
- IMPLEMENTATION_*.md (2 files)
- QUICK_*.md (3 files)
- Other temporary (5 files)

**Reduction:** From 26 files in root to 2 (README.md and DELETION_RULES.md)

---

## 🛠️ In Progress

### Phase 2: Enable Component Tests
**Status:** 🟡 PENDING  
**Estimated time:** 1-2 hours

**Goal:** Enable the 63 React component tests currently excluded.

**Tasks:**
- [ ] Update vitest.config.ts (set environment to jsdom)
- [ ] Configure React Testing Library
- [ ] Verify that 4 component files pass:
   - CartItem.test.tsx
   - CartSummary.test.tsx
   - Header.test.tsx
   - Footer.test.tsx

---

## 📋 Next Steps (High Priority)

### Phase 3: Consolidate Validation Tests
**Priority:** High  
**Estimated time:** 2-3 hours

**Problem:** Duplicate validations in unit + integration + E2E.

**Solution:** Keep only in unit/.

**Tasks:**
- [ ] Keep validations in tests/unit/validation.test.ts
- [ ] Simplify tests/integration/api/register.test.ts
- [ ] Simplify tests/e2e/auth/login.spec.ts

**Expected result:** ~15 fewer tests, ~2 minutes faster

---

### Phase 4: Create Critical E2E Tests
**Priority:** High  
**Estimated time:** 6-8 hours

**Problem:** Only 19 E2E tests currently. Critical flows are missing.

**Files to create:**
1. `tests/e2e/shop/catalog.spec.ts`
   - Navigate product catalog
   - Filter by category
   - Search products
   - View detail

2. `tests/e2e/shop/cart.spec.ts`
   - Add to cart
   - Update quantity
   - Remove product
   - Persistence

3. `tests/e2e/shop/checkout.spec.ts`
   - Complete checkout process
   - Stripe integration
   - Success page

4. `tests/e2e/admin/products.spec.ts`
   - Login as admin
   - Create/edit/delete product
   - Upload images

5. `tests/e2e/admin/orders.spec.ts`
   - View orders
   - Update status
   - View detail

**Expected result:** +40-50 new E2E tests

---

### Phase 5: Clean Redundant Integration Tests
**Priority:** Medium-High  
**Estimated time:** 3-4 hours

**Objective:** Reduce 17 integration test files to ~5-6 focused ones.

**Proposed consolidations:**
- [ ] Create tests/integration/auth.test.ts (merge login + middleware + register)
- [ ] Create tests/integration/products.test.ts (merge products + detail + admin)
- [ ] Remove non-critical tests:
   - admin/alerts.test.ts
   - admin/dashboard-ui.test.ts
   - admin/invoices.test.ts
   - admin/messages.test.ts
   - admin/panel.test.ts
   - admin/orders.test.ts
   - account/profile.test.ts
   - pages/*.test.ts

**Expected result:** ~50% fewer lines, more focused tests

---

### Phase 6: Simplify Test Helpers
**Priority:** Medium  
**Estimated time:** 1-2 hours

**Objective:** From 7 helper files to 1-2.

**Actions:**
- [ ] Create tests/helpers.ts consolidated (~80 lines)
- [ ] Simplify tests/setup.ts (~40 lines)
- [ ] Remove:
   - db-integration-setup.ts
   - db-cleanup.ts
   - db-wait.ts
   - db-mutex.ts
   - db-transactions.ts

**Expected result:** More maintainable code

---

## 📊 Target Metrics

### Before vs After

| Metric | Current | Target | Change |
|--------|---------|--------|--------|
| Docs files (root) | 26 | 2 | -92% |
| Unit tests | ~25 | 60+ | +140% |
| Integration tests | ~290 | ~100 | -65% |
| E2E tests | 19 | 60+ | +215% |
| Test helpers | 7 | 1-2 | -75% |
| Total test lines | ~5,900 | ~2,500 | -58% |

---

## 🔮 Low Priority (Future)

### Ideas for Later

- [ ] Performance tests (lighthouse CI)
- [ ] Accessibility tests (axe-core)
- [ ] Automated security tests
- [ ] Load tests (k6 or similar)
- [ ] Visual regression testing
- [ ] Mutation testing

---

## 📝 Notes

**Plan start date:** April 2, 2026  
**Responsible:** OpenCode AI  
**Branch:** refactor/reconstruccion-tests-docs

**Rules:**
1. One phase at a time
2. Verify before continuing
3. Commit after each phase
4. Rollback always available

**Backup created:** `backup-docs-20260402-XXXXXX.tar.gz`

---

**Last updated:** April 2, 2026