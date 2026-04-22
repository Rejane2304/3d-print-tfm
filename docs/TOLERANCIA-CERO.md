# REGLA DE TOLERANCIA CERO - CÓDIGO FUENTE

## 📋 DEFINICIÓN

**Tolerancia Cero** significa que el código fuente debe cumplir con:

- ✅ **0 errores de TypeScript**
- ✅ **0 errores de ESLint**
- ✅ **0 errores de SonarQube**
- ✅ **0 advertencias (warnings)**
- ✅ **0 archivos sin formato correcto**
- ✅ **0 imports no usados**
- ✅ **0 variables no usadas**
- ✅ **0 funciones vacías**
- ✅ **0 tipos 'any' implícitos**
- ✅ **0 console.log en código de producción**

## 🚫 REGLAS ESTRICTAS

### 1. TypeScript

```typescript
// ❌ PROHIBIDO
catch (err: any) { }

// ✅ PERMITIDO
catch (err: unknown) { }
```

### 2. ESLint

- Variables no usadas: ERROR (no warning)
- Imports no usados: ERROR
- `console.log` en API: ERROR
- Tipos `any`: ERROR

### 3. Prettier

- Todo el código debe estar formateado
- No se aceptan archivos sin formato

### 4. Carpetas

- No se permiten carpetas vacías
- Todo código debe tener propósito

## 🛠️ SCRIPT DE VERIFICACIÓN

```bash
# Ejecutar antes de cada commit
./scripts/zero-tolerance-check.js
```

## 📁 ESTRUCTURA LIMPIA

```
scripts/
├── audit-database.ts           # Auditoría de BD
├── pre-commit-check.sh         # Verificación pre-commit
├── verify-and-fix.sh           # Verificación completa
├── wait-for-postgres.mjs       # Docker helper
├── validate-db-safety.ts       # Seguridad BD
├── run-audit.sh                # Wrapper auditoría
├── test-paypal.sh              # Tests PayPal
└── zero-tolerance-check.js     # Check tolerancia cero ⭐
```

## ⚙️ CONFIGURACIÓN

### .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["error", { "allow": ["error", "warn"] }]
  }
}
```

### pre-commit hook

```bash
#!/bin/bash
./scripts/zero-tolerance-check.js || exit 1
```

## ✅ CHECKLIST PRE-COMMIT

- [ ] Ejecutar `./scripts/zero-tolerance-check.js`
- [ ] Verificar que todos los checks pasan
- [ ] Si hay errores, corregir antes de commit
- [ ] No hacer bypass de las verificaciones

## 🎯 OBJETIVO

**Código 100% limpio, sin advertencias, listo para producción.**

> "Cero es el único número aceptable de errores en el código fuente."

---

_Documento creado: Abril 2025_
_Última actualización: Abril 2026_
_Tolerancia: CERO_
