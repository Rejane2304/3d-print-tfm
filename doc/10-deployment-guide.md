# GUÍA DE DESPLIEGUE - 3D PRINT TFM

## 🚀 Preparación para Producción

### Requisitos Previos

- [ ] Cuenta en Vercel (recomendado) o similar
- [ ] Cuenta en Supabase (PostgreSQL)
- [ ] Cuenta en Stripe (modo producción)
- [ ] Dominio configurado (opcional)

## 📋 Checklist Pre-Despliegue

### 1. Variables de Entorno

Crear archivo `.env.production`:

```bash
# Base de datos (Supabase Production)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_SECRET="tu-secreto-muy-seguro-32-caracteres"
NEXTAUTH_URL="https://tu-dominio.vercel.app"

# Stripe (Producción)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Configuración
NODE_ENV="production"
```

### 2. Base de Datos

```bash
# 1. Crear proyecto en Supabase
# 2. Copiar DATABASE_URL del panel de Supabase
# 3. Ejecutar migraciones
npx prisma migrate deploy

# 4. Cargar datos iniciales (opcional)
npm run db:seed
```

### 3. Stripe Configuration

1. Cambiar a modo producción en Stripe Dashboard
2. Actualizar webhook URL: `https://tu-dominio.com/api/webhooks/stripe`
3. Verificar eventos suscritos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## 🔧 Configuración Vercel

### 1. Importar Proyecto

```bash
# Opción A: CLI
npm i -g vercel
vercel --prod

# Opción B: Git Integration
# Conectar repositorio en dashboard.vercel.com
```

### 2. Environment Variables en Vercel

Agregar en Project Settings → Environment Variables:

```
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### 3. Build Settings

```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## 📊 Configuración de Dominio Personalizado

### Opción A: Vercel (Recomendado)

1. Comprar dominio en Vercel o transferir
2. Configurar DNS:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

### Opción B: Dominio Externo

1. Agregar dominio en Vercel Dashboard
2. Copiar registros DNS proporcionados
3. Configurar en proveedor DNS
4. Esperar propagación (24-48h)

## 🔒 Configuración de Seguridad

### HTTPS/SSL
- ✅ Automático en Vercel
- ✅ Certificados SSL gratuitos (Let's Encrypt)

### Headers de Seguridad

Agregar a `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
        }
      ]
    }
  ];
}
```

### Rate Limiting

Configurado en middleware para:
- Login: 5 intentos / minuto
- API general: 100 requests / minuto

## 📈 Monitoreo

### Vercel Analytics

1. Habilitar en Dashboard: Analytics → Web Vitals
2. Ver métricas en tiempo real:
   - LCP
   - FID
   - CLS
   - TTFB

### Logs

Acceder en Vercel Dashboard:
- Functions Logs
- Build Logs
- Edge Network Logs

## 🔄 CI/CD Pipeline

### GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:unit
        
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📦 Verificación Post-Despliegue

### 1. Funcionalidad Básica

- [ ] Página principal carga
- [ ] Navegación funciona
- [ ] Catálogo de productos carga
- [ ] Filtros funcionan
- [ ] Responsive en mobile

### 2. Autenticación

- [ ] Registro de usuarios
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Redirecciones correctas
- [ ] Admin puede acceder a /admin

### 3. Carrito y Checkout

- [ ] Agregar al carrito
- [ ] Modificar cantidades
- [ ] Checkout con Stripe
- [ ] Webhook procesa pagos
- [ ] Email de confirmación (si configurado)

### 4. Panel Admin

- [ ] Dashboard carga
- [ ] CRUD de productos
- [ ] Gestión de pedidos
- [ ] Facturación funciona
- [ ] Alertas funcionan

## 🆘 Troubleshooting

### Error: "relation does not exist"

**Solución**: Ejecutar migraciones
```bash
npx prisma migrate deploy
```

### Error: Stripe webhook no funciona

**Verificar**:
1. URL webhook correcta
2. Secreto configurado
3. Eventos suscritos

### Error: Build falla

**Verificar**:
1. Variables de entorno configuradas
2. `next.config.js` válido
3. Dependencias instaladas

### Error: 404 en rutas dinámicas

**Verificar**:
1. Configuración de rewrites en `next.config.js`
2. ISR configurado correctamente

## 📞 Soporte

### Recursos

- **Documentación Next.js**: https://nextjs.org/docs
- **Documentación Prisma**: https://www.prisma.io/docs
- **Documentación Stripe**: https://stripe.com/docs
- **Documentación Supabase**: https://supabase.com/docs

### Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Rollback
vercel rollback

# Redeploy
vercel --force

# Test local en modo producción
npm run build && npm start
```

## ✅ Checklist Final

Antes del lanzamiento:

- [ ] Tests pasando (323+)
- [ ] Lighthouse score > 90
- [ ] SSL funcionando
- [ ] Webhook Stripe configurado
- [ ] Base de datos en producción
- [ ] Variables de entorno configuradas
- [ ] Dominio configurado
- [ ] Analytics habilitado
- [ ] Backup configurado (si aplica)

---

**Nota**: Este es un proyecto académico. Para producción real, considerar:
- Plan de hosting adecuado
- Monitoring avanzado (Sentry, LogRocket)
- Tests de carga
- Disaster recovery plan

**Última actualización**: 2025-04-01