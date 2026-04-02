# Guía de Testing - 3D Print TFM

Guía completa y actualizada para ejecutar y mantener tests del proyecto.

---

## 📁 Estructura de Tests

```
tests/
├── unit/           # Lógica pura, validaciones, componentes
├── integration/    # APIs, base de datos, autenticación
└── e2e/            # Flujos completos de usuario (Playwright)
```

### Tipos de Tests

| Tipo | Qué testea | Ejemplos |
|------|-----------|----------|
| **Unitarios** | Funciones puras, lógica aislada | Validaciones, cálculos, componentes React |
| **Integración** | APIs y base de datos | Endpoints, queries, auth, middleware |
| **E2E** | Flujos completos de usuario | Login → Carrito → Checkout → Pago |

---

## 🚀 Comandos

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo unitarios
npm run test:unit

# Solo integración (requiere BD configurada)
npm run test:integration

# Solo E2E (requiere servidor corriendo)
npm run test:e2e

# Con cobertura
npm run test:coverage
```

### Base de Datos para Tests

```bash
# Iniciar PostgreSQL en Docker para tests
docker-compose -f docker-compose.test.yml up -d

# Configurar variables de entorno
cp .env.test.example .env.test
# Editar DATABASE_URL en .env.test

# Ejecutar migraciones
DATABASE_URL="postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test" npx prisma migrate deploy
```

---

## 📝 Convenciones

### Nomenclatura

- `*.test.ts` - Tests de TypeScript
- `*.spec.ts` - Tests E2E (Playwright)
- `describe('Contexto', () => { ... })` - Agrupar tests relacionados
- `it('debería hacer X cuando Y', () => { ... })` - Descripción clara

### Ejemplo de Buen Test

```typescript
// tests/unit/validations.test.ts
describe('Validaciones de Email', () => {
  it('debe aceptar email válido', () => {
    const result = validarEmail('test@example.com')
    expect(result.valido).toBe(true)
  })

  it('debe rechazar email sin @', () => {
    const result = validarEmail('testexample.com')
    expect(result.valido).toBe(false)
    expect(result.error).toBe('Formato de email inválido')
  })
})
```

### Ejemplo de Test de Integración

```typescript
// tests/integration/api/auth.test.ts
describe('POST /api/auth/registro', () => {
  it('debe crear usuario con datos válidos', async () => {
    const response = await fetch('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        nombre: 'Test User'
      })
    })
    
    expect(response.status).toBe(201)
    const user = await prisma.usuario.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(user).toBeTruthy()
  })
})
```

---

## 🔧 Configuración

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

Ver `playwright.config.ts` para configuración de navegadores y dispositivos.

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

```bash
# Verificar que Docker está corriendo
docker ps | grep postgres

# Si no está corriendo:
docker-compose -f docker-compose.test.yml up -d

# Esperar 5 segundos y reintentar
sleep 5 && npm run test:integration
```

### Error: "Cannot find module '@/lib/db/prisma'"

```bash
# Verificar que el path alias está configurado
# en vitest.config.ts debe tener:
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

### Tests Intermitentes (Flaky)

Si un test falla aleatoriamente:
1. Añadir `await` donde falte
2. Verificar limpieza de BD entre tests
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
