# 🔒 Sistema de Protección contra Deuda Técnica

## Resumen

Este proyecto implementa una arquitectura **"Shift Left on Quality"** que garantiza **cero deuda técnica** mediante automatización de calidad desde el primer commit.

---

## 🏗️ Arquitectura de Calidad

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRE-COMMIT HOOK (local)                                        │
│  ├─ ESLint --fix                                                │
│  ├─ Prettier --write                                            │
│  └─ TypeScript type-check                                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRE-PUSH HOOK (local)                                          │
│  ├─ Unit Tests (80%+ coverage)                                  │
│  └─ Type Check                                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PULL REQUEST (GitHub)                                          │
│  ├─ Block Direct Push Workflow ❌                               │
│  ├─ Quality Gate (ESLint + TypeScript + SonarQube)            │
│  ├─ Unit Tests + Coverage                                       │
│  ├─ Integration Tests (PostgreSQL)                            │
│  ├─ E2E Tests (Playwright)                                    │
│  ├─ Build Verification                                          │
│  └─ Code Review Approval (1 required)                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  MERGE TO MAIN                                                  │
│  └─ Deploy to Production (Vercel)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 REGLAS DE PROTECCIÓN

### 1. NO SE PUEDE hacer push directo a `main` o `develop`

```bash
❌ git push origin main
❌ git push origin develop

✅ git checkout -b feature/nueva-funcionalidad
✅ git commit -m "feat: descripción"
✅ git push origin feature/nueva-funcionalidad
✅ # Crear PR en GitHub
✅ # Esperar checks + aprobación
✅ # Merge con "Squash and merge"
```

### 2. TODOS los checks deben pasar

| Check              | Descripción                                | Bloquea Merge |
| ------------------ | ------------------------------------------ | ------------- |
| Quality Gate       | ESLint + Prettier + TypeScript + SonarQube | ✅            |
| Unit Tests         | 80%+ coverage requerido                    | ✅            |
| Integration Tests  | BD PostgreSQL real                         | ✅            |
| E2E Tests          | Playwright en Chrome, Firefox, Safari      | ✅            |
| Build Verification | Next.js build sin errores                  | ✅            |
| Code Review        | 1 aprobación requerida                     | ✅            |

### 3. Código sin aprobar NO puede entrar

- Los workflows fallan si hay errores
- GitHub bloquea el merge si falla cualquier check
- Los CODEOWNERS deben aprobar los cambios

---

## 🛠️ Scripts Disponibles

### Desarrollo Local

```bash
# Antes de commitear (automático con Husky)
npm run pre-commit

# Verificar tipos
npm run type-check

# Lint y formateo
npm run lint:fix
npm run format

# Tests
npm run test:unit
npm run test:integration
npm run test:e2e
```

### CI/CD

```bash
# Todos los tests
npm run test:all

# Solo calidad
npm run lint && npm run type-check

# Con coverage
npm run test:unit:coverage
```

---

## 📁 Estructura de Archivos de Configuración

```
.github/
├── settings.yml                    # Config de GitHub (branch protection)
├── CODEOWNERS                      # Quién debe aprobar cada archivo
└── workflows/
    ├── ci.yml                      # Pipeline principal
    ├── block-direct-push.yml       # Bloquea push directo
    └── dependabot.yml              # Actualizaciones automáticas

src/
└── lib/
    └── logger/
        └── index.ts                # Logger estructurado (no console.log)

package.json
├── lint-staged                     # Pre-commit hook
├── husky                          # Git hooks
└── scripts de testing

prisma/
└── schema.prisma                   # Schema DB
```

---

## 🔧 Configuración GitHub (Manual)

Si los archivos `.github/settings.yml` no aplican automáticamente:

### Branch Protection Rules

1. Ir a: `Settings > Branches > Add rule`
2. **Branch name pattern**: `main`
3. ✅ **Require a pull request before merging**
   - ✅ Require approvals: `1`
   - ✅ Dismiss stale PR approvals
   - ✅ Require code owner review
4. ✅ **Require status checks to pass**
   - ✅ Require branches to be up to date
   - Status checks: `Quality Gate`, `Unit Tests`, `Integration Tests`, `Build Verification`
5. ✅ **Restrict pushes that create files**
6. ✅ **Require linear history**
7. ✅ **Include administrators**

### CODEOWNERS

Crear `.github/CODEOWNERS`:

```
# Global owner
* @rejanerodrigues

# API changes
/src/app/api/ @rejanerodrigues

# Database changes
/prisma/ @rejanerodrigues

# Tests
tests/ @rejanerodrigues
```

---

## 🧪 Flujo de Trabajo Recomendado

### 1. Iniciar Trabajo

```bash
# Actualizar main
git checkout main
git pull origin main

# Crear feature branch
git checkout -b feature/nombre-descriptivo

# Hacer cambios...
```

### 2. Desarrollar con Calidad

```bash
# El pre-commit hook ejecuta automáticamente:
# - ESLint --fix
# - Prettier --write
# - TypeScript check

git add .
git commit -m "feat: descripción del cambio"

# El pre-push hook ejecuta:
# - Unit tests
# - Type check

git push origin feature/nombre-descriptivo
```

### 3. Crear Pull Request

1. En GitHub, click "Compare & pull request"
2. Seleccionar base: `main`, compare: `feature/...`
3. Llenar descripción con:
   - Qué cambios hace
   - Por qué es necesario
   - Cómo probarlo
4. Crear PR

### 4. Revisión Automática

GitHub ejecuta:

- ✅ Quality Gate
- ✅ Unit Tests
- ✅ Integration Tests
- ✅ E2E Tests
- ✅ Build Verification
- ✅ SonarQube Scan

Si todo pasa ✅ → Esperar code review
Si algo falla ❌ → Corregir y pushear más commits

### 5. Code Review

- Revisor revisa código
- Comenta si hay problemas
- Aprovecha si está OK
- **Requerido: 1 aprobación**

### 6. Merge

```
Squash and merge
```

- Todos los commits de la rama → 1 commit en main
- Historial lineal y limpio
- Mensaje descriptivo del PR

---

## 🎯 Beneficios

| Problema                      | Solución                      |
| ----------------------------- | ----------------------------- |
| Deuda técnica acumulada       | ✅ Cada PR pasa validaciones  |
| Código sin testear            | ✅ 80%+ coverage obligatorio  |
| Errores en producción         | ✅ E2E tests antes de deploy  |
| Estilos inconsistentes        | ✅ Prettier + ESLint auto-fix |
| Conflictos en main            | ✅ Linear history             |
| Cambios sin revisión          | ✅ Code owners approval       |
| Tests de integración fallando | ✅ CI con PostgreSQL real     |
| Console.log en producción     | ✅ Logger estructurado        |
| Queries de Prisma en logs     | ✅ Solo con flag explícito    |

---

## 🚨 Qué hacer si algo falla

### "No puedo hacer push"

```bash
# Verificar rama actual
git branch

# Si estás en main/develop, cambiar:
git checkout -b feature/tu-cambio

# Commitear y pushear la rama
git add .
git commit -m "feat: tu cambio"
git push origin feature/tu-cambio

# Crear PR en GitHub
```

### "Los tests fallan en CI pero pasan local"

1. Verificar variables de entorno
2. Limpiar caché: `rm -rf .next node_modules/.cache`
3. Reinstalar: `npm ci`
4. Ejecutar tests: `npm run test:all`

### "Husky no funciona"

```bash
# Reinstalar husky
rm -rf .husky
npx husky init
echo 'npm run pre-commit' > .husky/pre-commit
```

---

## 📚 Referencias

- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [SonarQube Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

## ✅ Checklist antes de commitear

```bash
# Esto se ejecuta automáticamente con husky
# Si quieres verificar manualmente:

npm run type-check      # ✅ Tipos correctos
npm run lint:fix        # ✅ Sin errores de lint
npm run format:check    # ✅ Formato correcto
npm run test:unit       # ✅ Unit tests pasan
npm run build           # ✅ Build sin errores
```

---

**Desarrollado con ❤️ y sin deuda técnica.**
