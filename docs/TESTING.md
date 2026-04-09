# Guía de Testing - 3D Print TFM

Guía completa para ejecutar y mantener tests del proyecto.

---

## 🚀 Comandos

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests unitarios (validadores, utilidades)
npm run test:unit

# Tests de integración (APIs, BD) - Requiere PostgreSQL/Docker
npm run test:integration

# Tests E2E (flujos completos) - Requiere servidor corriendo
npm run test:e2e

# Con reporte de cobertura
npm run test:coverage
```

---

## 🔧 Configuración

### Vitest (`vitest.config.ts`)

Configuración para tests unitarios e integración.

### Playwright (`playwright.config.ts`)

Configuración para tests E2E en múltiples navegadores y dispositivos.

**Dispositivos soportados:**
- Desktop Chrome/Firefox/Safari
- Tablet iPad
- Mobile iPhone
- Desktop 4K

---

## 📁 Estructura de Tests

```
tests/
├── unit/                       # Tests unitarios
│   ├── validators/             # Validaciones Zod
│   ├── security/               # Seguridad de contraseñas
│   └── helpers/                # Utilidades
├── integration/                # Tests de integración
│   └── api/
│       ├── auth.test.ts
│       ├── products.test.ts
│       ├── cart.test.ts
│       ├── checkout.test.ts
│       ├── orders.test.ts
│       ├── invoices.test.ts
│       └── ...
└── e2e/                        # Tests E2E (Playwright)
    ├── auth.spec.ts
    ├── shop.spec.ts
    └── admin.spec.ts
```

---

## 🧪 Tipos de Tests

### Tests Unitarios

Lógica pura, sin dependencias externas.

**Ejemplos:**
- Validadores Zod (auth, productos, órdenes, direcciones)
- Seguridad de contraseñas (fuerza, patrones)
- Formateo de datos
- Utilidades de cálculo

### Tests de Integración

APIs con base de datos real (testcontainers).

**Ejemplos:**
- CRUD de productos
- Operaciones de carrito
- Proceso de checkout
- Generación de facturas

### Tests E2E

Flujos completos de usuario.

**Ejemplos:**
- Registro → Login → Compra
- Panel admin: crear producto → editar → eliminar
- Aplicación de cupones en checkout

---

## 📊 Métricas Actuales

| Tipo | Tests | Cobertura |
|------|-------|-----------|
| Unitarios | 25+ | 80%+ |
| Integración | 290+ | 80%+ |
| E2E | 19 | 6 dispositivos |

**Meta de cobertura:** 80%+

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

```bash
# Verificar que Docker Desktop está abierto
docker ps

# Si no está corriendo, iniciar Docker y reintentar
npm run test:integration
```

### Tests Intermitentes (Flaky)

Si un test falla aleatoriamente:
1. Verificar `await` en operaciones asíncronas
2. Verificar limpieza de BD entre tests
3. Aumentar timeout si es necesario: `it('...', async () => {}, 15000)`

---

## ✅ Buenas Prácticas

### ✅ Hacer

- **Probar comportamiento**, no implementación
- **Nombres descriptivos**: `it('should return 401 when unauthenticated')`
- **Limpiar después**: usar `afterEach` para limpiar BD
- **Datos predecibles**: usar IDs fijos, no aleatorios

### ❌ Evitar

- No hardcodear IDs de producción
- No usar `setTimeout` arbitrario para "esperar"
- No repetir mismos tests en 3 capas

---

## 📝 Agregar Nuevos Tests

### Paso 1: Decidir el Tipo

- **¿Es lógica pura?** → `tests/unit/`
- **¿Usa BD o APIs?** → `tests/integration/`
- **¿Es un flujo de usuario?** → `tests/e2e/`

### Paso 2: Crear Archivo

```bash
# Unitario
touch tests/unit/validators/my-feature.test.ts

# Integración
touch tests/integration/api/my-endpoint.test.ts

# E2E
touch tests/e2e/my-flow.spec.ts
```

### Paso 3: Verificar

```bash
npm run test:unit -- tests/unit/validators/my-feature.test.ts
```

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

**Última actualización:** Abril 2025
