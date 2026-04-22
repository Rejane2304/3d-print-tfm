# Deployment Guide

Guía completa para desplegar el proyecto 3D Print TFM en producción.

## Plataformas Recomendadas

### Vercel (Recomendado)

Vercel es la plataforma óptima para Next.js con:

- **Edge Network** global
- **Serverless Functions** automáticas
- **CI/CD** integrado
- **Previews** por PR
- **Analytics** integrado

### Alternativas

| Plataforma        | Pros           | Contras                       |
| ----------------- | -------------- | ----------------------------- |
| **Railway**       | Fácil de usar  | Menos optimizado para Next.js |
| **AWS Amplify**   | Ecosistema AWS | Más complejo de configurar    |
| **Digital Ocean** | Control total  | Requiere más configuración    |

---

## Despliegue en Vercel

### Paso 1: Preparar Repositorio

Asegúrate de tener:

```bash
# Todo committeado
git status

# Tests pasando
npm run test:unit

# Build local exitoso
npm run build
```

### Paso 2: Conectar a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Sign up/login con GitHub
3. Click "Add New Project"
4. Importar `Rejane2304/3d-print-tfm`
5. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`

### Paso 3: Configurar Variables de Entorno

En el dashboard de Vercel, agrega:

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app

# Stripe (Producción)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PayPal (Producción)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...

# Opcional
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Obtener valores:**

- Supabase: Dashboard → Settings → Database → Connection String
- Stripe: Dashboard → Developers → API Keys
- PayPal: Dashboard → Apps & Credentials
- NextAuth Secret: `openssl rand -base64 32`

### Paso 4: Deploy

Click "Deploy" y espera a que complete.

**URLs:**

- Production: `https://your-domain.vercel.app`
- Preview (por PR): `https://your-project-git-branch-username.vercel.app`

---

## Configuración de Base de Datos (Producción)

### Supabase

1. **Crear proyecto** en [supabase.com](https://supabase.com)
2. **Obtener connection strings:**
   - Settings → Database
   - Connection string: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
3. **Configurar Pooler** (recomendado):
   - Usar: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Migraciones

```bash
# Ejecutar migraciones en producción
npm run db:migrate:prod

# O manualmente:
DATABASE_URL="produccion_url" npx prisma migrate deploy
```

### Seed (Solo primera vez)

```bash
# ⚠️ Solo ejecutar una vez
npm run db:seed:prod
```

---

## Configuración de Stripe (Producción)

### 1. Activar Cuenta

- Ve a [stripe.com](https://stripe.com)
- Completar verificación de cuenta
- Activar modo live

### 2. Configurar Webhooks

En Stripe Dashboard → Developers → Webhooks:

```
Endpoint URL: https://your-domain.vercel.app/api/webhooks/stripe
Events to listen to:
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
- invoice.payment_succeeded
```

Copiar el `Signing secret` y agregarlo a `STRIPE_WEBHOOK_SECRET`.

### 3. Configurar Métodos de Pago

Dashboard → Settings → Payment methods:

- Tarjetas (Visa, Mastercard, etc.)
- Métodos locales según país

---

## Configuración de PayPal (Producción)

### 1. Activar Cuenta Business

- Ve a [paypal.com](https://paypal.com)
- Crear cuenta business
- Completar verificación

### 2. Obtener Credenciales

Dashboard → Apps & Credentials → Live:

- Client ID
- Secret

### 3. Configurar Webhooks

```
URL: https://your-domain.vercel.app/api/webhooks/paypal
Event types:
- Checkout order approved
- Payment capture completed
- Payment capture denied
```

---

## Configuración de Dominio Personalizado

### Vercel

1. Dashboard → Project Settings → Domains
2. Add Domain: `tudominio.com`
3. Seguir instrucciones de DNS:
   - Tipo A → 76.76.21.21
   - O CNAME → cname.vercel-dns.com

### SSL

Vercel proporciona SSL automático vía Let's Encrypt.

---

## Checklist Pre-Deploy

### Código

- [ ] Tests pasando (`npm run test:unit`)
- [ ] Type checking sin errores (`npm run type-check`)
- [ ] Linting sin errores (`npm run lint`)
- [ ] Build local exitoso (`npm run build`)
- [ ] Sin console.logs de debug

### Variables de Entorno

- [ ] DATABASE_URL configurada
- [ ] DIRECT_URL configurada
- [ ] NEXTAUTH_SECRET generado
- [ ] NEXTAUTH_URL actualizado
- [ ] Stripe keys (live) configuradas
- [ ] PayPal keys (live) configuradas

### Base de Datos

- [ ] Migraciones ejecutadas
- [ ] Seed aplicado (solo primera vez)
- [ ] Índices creados
- [ ] Backups configurados

### Terceros

- [ ] Stripe webhooks configurados
- [ ] PayPal webhooks configurados
- [ ] Supabase configurado
- [ ] DNS configurado (si aplica)

### Seguridad

- [ ] HTTPS forzado
- [ ] Headers de seguridad configurados
- [ ] Rate limiting activo
- [ ] CORS configurado

---

## CI/CD

### GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### Vercel Git Integration

Automático al conectar repo:

- Push a `main` → Deploy producción
- Push a PR → Deploy preview

---

## Monitoreo

### Vercel Analytics

Habilitar en Dashboard → Analytics:

- Web Vitals
- Traffic
- Performance

### Sentry (Opcional)

```bash
npm install @sentry/nextjs
```

Configurar en `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: '3d-print-tfm',
});
```

### Uptime Monitoring

Usar servicios como:

- [UptimeRobot](https://uptimerobot.com) (gratis)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

---

## Backup y Recuperación

### Base de Datos (Supabase)

Backups automáticos diarios incluidos.

Para backup manual:

```bash
pg_dump $DATABASE_URL > backup.sql
```

Para restaurar:

```bash
psql $DATABASE_URL < backup.sql
```

### Archivos

- **Código:** GitHub
- **Imágenes:** Supabase Storage (backups automáticos)

---

## Escalado

### Vertical (Más potencia)

Vercel Pro: Mayor memoria y CPU

### Horizontal (Más instancias)

Automático en Vercel según tráfico.

### Base de Datos

Supabase Scale plan para:

- Más conexiones
- Read replicas
- PgBouncer

---

## Solución de Problemas

### "Build Failed"

1. Verificar logs en Vercel Dashboard
2. Ejecutar `npm run build` localmente
3. Verificar variables de entorno

### "Database Connection Error"

1. Verificar DATABASE_URL
2. Verificar IP whitelist en Supabase
3. Verificar SSL mode

### "502 Bad Gateway"

1. Serverless function timeout
2. Verificar logs de función
3. Optimizar cold start

### "Stripe Webhook Failed"

1. Verificar endpoint URL
2. Verificar STRIPE_WEBHOOK_SECRET
3. Verificar logs en Dashboard Stripe

---

## Comandos Útiles

```bash
# Deploy manual con Vercel CLI
npm i -g vercel
vercel --prod

# Ver logs en tiempo real
vercel logs --follow

# Variables de entorno
vercel env add DATABASE_URL
vercel env ls

# Dominios
vercel domains add tudominio.com
```

---

## Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## Contacto

Para problemas de deploy:

- Ver [AGENTS.md](/AGENTS.md)
- Crear issue en GitHub
- Consultar documentación oficial
