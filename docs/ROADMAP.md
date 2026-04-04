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
- [ ] Simplificar tests/integration/api/registro.test.ts
- [ ] Simplificar tests/e2e/auth/login.spec.ts

**Resultado esperado:** ~15 tests menos, ~2 minutos más rápido

---

### Fase 4: Crear Tests E2E Críticos
**Prioridad:** Alta  
**Tiempo estimado:** 6-8 horas

**Problema:** Solo 19 tests E2E actualmente. Faltan flujos críticos.

**Archivos a crear:**
1. `tests/e2e/shop/catalog.spec.ts`
   - Navegar catálogo
   - Filtrar por categoría
   - Buscar productos
   - Ver detalle

2. `tests/e2e/shop/cart.spec.ts`
   - Agregar al carrito
   - Actualizar cantidad
   - Eliminar producto
   - Persistencia

3. `tests/e2e/shop/checkout.spec.ts`
   - Proceso completo de checkout
   - Integración Stripe
   - Página de éxito

4. `tests/e2e/admin/products.spec.ts`
   - Login como admin
   - Crear/editar/eliminar producto
   - Subir imágenes

5. `tests/e2e/admin/orders.spec.ts`
   - Ver pedidos
   - Actualizar estado
   - Ver detalle

**Resultado esperado:** +40-50 tests E2E nuevos

---

### Fase 5: Limpiar Tests de Integración Redundantes
**Prioridad:** Media-Alta  
**Tiempo estimado:** 3-4 horas

**Objetivo:** Reducir 17 archivos de integración a ~5-6 focalizados.

**Consolidaciones propuestas:**
- [ ] Crear tests/integration/auth.test.ts (fusionar login + middleware + registro)
- [ ] Crear tests/integration/products.test.ts (fusionar productos + detalle + admin)
- [ ] Eliminar tests no críticos:
  - admin/alerts.test.ts
  - admin/dashboard-ui.test.ts
  - admin/invoices.test.ts
  - admin/messages.test.ts
  - admin/panel.test.ts
  - account/perfil.test.ts
  - pages/*.test.ts

**Resultado esperado:** ~50% menos líneas, tests más enfocados

---

### Fase 6: Simplificar Helpers de Tests
**Prioridad:** Media  
**Tiempo estimado:** 1-2 horas

**Objetivo:** De 7 archivos helpers a 1-2.

**Acciones:**
- [ ] Crear tests/helpers.ts consolidado (~80 líneas)
- [ ] Simplificar tests/setup.ts (~40 líneas)
- [ ] Eliminar:
  - db-integration-setup.ts
  - db-cleanup.ts
  - db-wait.ts
  - db-mutex.ts
  - db-transactions.ts

**Resultado esperado:** Código más mantenible

---

## 📊 Métricas Objetivo

### Antes vs Después

| Métrica | Actual | Objetivo | Cambio |
|---------|--------|----------|--------|
| Archivos docs (raíz) | 26 | 2 | -92% |
| Tests unitarios | 25 | 60+ | +140% |
| Tests integración | ~290 | ~100 | -65% |
| Tests E2E | 19 | 60+ | +215% |
| Helpers tests | 7 | 1-2 | -75% |
| Total líneas tests | ~5,900 | ~2,500 | -58% |

---

## 🔮 Prioridad Baja (Futuro)

### Ideas para Después

- [ ] Tests de rendimiento (lighthouse CI)
- [ ] Tests de accesibilidad (axe-core)
- [ ] Tests de seguridad automatizados
- [ ] Tests de carga (k6 o similar)
- [ ] Visual regression testing
- [ ] Mutation testing

---

## 📝 Notas

**Fecha inicio del plan:** 2 de Abril de 2026  
**Responsable:** OpenCode AI  
**Branch:** refactor/reconstruccion-tests-docs

**Reglas:**
1. Una fase a la vez
2. Verificar antes de continuar
3. Commit después de cada fase
4. Rollback disponible siempre

**Backup creado:** `backup-docs-20260402-XXXXXX.tar.gz`

---

**Última actualización:** 2 de Abril de 2026
