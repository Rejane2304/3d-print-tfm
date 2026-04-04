# Guía de Testing - 3D Print TFM

## 🚀 Commands

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
1. Añadir `await` donde falte

# If not running:
2. Verificar limpieza de BD entre tests

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
3. Aumentar timeout si es necesario: `it('...', async () => { ... }, 15000)`

---

## 📊 Cobertura

### Métricas Actuales (Objetivo)

| Tipo | Tests Actuales | Objetivo | Estado |
|------|---------------|----------|--------|
| Unitarios | ~25 | 60+ | 🟡 En progreso |
| Integración | ~290 | ~100 (focalizados) | 🟡 En consolidación |
| E2E | 19 | 60+ | 🔴 Pendiente |

### Ver Cobertura

```bash
npm run test:coverage
# Abrir coverage/index.html
```

---

## 🎯 Buenas Prácticas

### ✅ Hacer

- **Testear comportamiento**, no implementación
- **Un assert por test** (idealmente)
- **Nombres descriptivos**: `it('debe retornar 401 cuando no autenticado')`
- **Limpiar después**: usar `afterEach` o `afterAll` para limpiar BD
- **Datos de test predecibles**: usar IDs fijos, no aleatorios

### ❌ No Hacer

- No testear implementación interna (cambiar implementación no debe romper tests)
- No usar `setTimeout` arbitrarios para "esperar"
- No hardcodear IDs de producción
- No dejar tests con `expect(true).toBe(true)` (placeholders)
- No repetir tests de validación en 3 capas (unit, integration, E2E)

---

## 📝 Añadir Nuevos Tests

### Paso 1: Decidir el Tipo

- **¿Es pura lógica?** → `tests/unit/`
- **¿Usa base de datos o APIs?** → `tests/integration/`
- **¿Es un flujo completo de usuario?** → `tests/e2e/`

### Paso 2: Crear el Archivo

```bash
# Unitario
touch tests/unit/mi-feature.test.ts

# Integración
touch tests/integration/api/mi-endpoint.test.ts

# E2E
touch tests/e2e/mi-flujo.spec.ts
```

### Paso 3: Escribir el Test

Ver ejemplos en "Convenciones" arriba.

### Paso 4: Ejecutar y Verificar

```bash
npm run test:unit -- tests/unit/mi-feature.test.ts
```

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Última actualización:** 2 de Abril de 2026  
**Mantenedor:** Equipo 3D Print TFM
