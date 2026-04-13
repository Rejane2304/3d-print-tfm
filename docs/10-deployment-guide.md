# DEPLOYMENT GUIDE - 3D PRINT TFM

## 🚀 Production Preparation

### Prerequisites

- [ ] Vercel account (recommended) or similar
- [ ] Supabase account (PostgreSQL)
- [ ] Stripe account (production mode)
- [ ] Domain configured (optional)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.production` file:

```bash
# Database (Supabase Production)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_SECRET="your-very-secure-secret-32-characters"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Stripe (Production)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Configuration
NODE_ENV="production"
```

### 4. Notes on Unified Auth

**Recent change (2026-04-01)**: The system now uses a unified `/auth` page with tabs for login and register.

- **New URLs**:
  - `/auth` - Unified page (login tab by default)
  - `/auth?tab=register` - Register tab

- **Old URLs** (redirect automatically):
  - `/login` → `/auth`
  - `/registro` → `/auth?tab=register`

- **No deployment changes required**: Redirects are automatic in the application.

### 2. Database

```bash
# 1. Create project in Supabase
# 2. Copy DATABASE_URL from Supabase panel
# 3. Run migrations
npx prisma migrate deploy

# 4. Load initial data (optional)
npm run db:seed
```

### 3. Stripe Configuration

1. Switch to production mode in Stripe Dashboard
2. Update webhook URL: `https://your-domain.com/api/webhooks/stripe`
3. Verify subscribed events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## 🔧 Vercel Configuration

### 1. Import Project

```bash
# Option A: CLI
npm i -g vercel
vercel --prod

# Option B: Git Integration
# Connect repository at dashboard.vercel.com
```

### 2. Environment Variables in Vercel

Add in Project Settings → Environment Variables:

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

## 📊 Custom Domain Configuration

### Option A: Vercel (Recommended)

1. Buy domain in Vercel or transfer
2. Configure DNS:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

### Option B: External Domain

1. Add domain in Vercel Dashboard
2. Copy provided DNS records
3. Configure at DNS provider
4. Wait for propagation (24-48h)

## 🔒 Security Configuration

### HTTPS/SSL

- ✅ Automatic in Vercel
- ✅ Free SSL certificates (Let's Encrypt)

### Security Headers

Add to `next.config.js`:

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

Configured in middleware for:

- Login: 5 attempts / minute
- General API: 100 requests / minute

## 📈 Monitoring

### Vercel Analytics

1. Enable in Dashboard: Analytics → Web Vitals
2. View real-time metrics:
   - LCP
   - FID
   - CLS
   - TTFB

### Logs

Access in Vercel Dashboard:

- Functions Logs
- Build Logs
- Edge Network Logs

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

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

## 📦 Post-Deployment Verification

### 1. Basic Functionality

- [ ] Home page loads
- [ ] Navigation works
- [ ] Product catalog loads
- [ ] Filters work
- [ ] Responsive on mobile

### 2. Authentication

- [ ] User registration
- [ ] Login works
- [ ] Logout works
- [ ] Correct redirects
- [ ] Admin can access /admin

### 3. Cart and Checkout

- [ ] Add to cart
- [ ] Modify quantities
- [ ] Checkout with Stripe
- [ ] Webhook processes payments
- [ ] Confirmation email (if configured)

### 4. Admin Panel

- [ ] Dashboard loads
- [ ] Product CRUD
- [ ] Order management
- [ ] Billing works
- [ ] Alerts work

## 🆘 Troubleshooting

### Error: "relation does not exist"

**Solution**: Run migrations

```bash
npx prisma migrate deploy
```

### Error: Stripe webhook not working

**Verify**:

1. Correct webhook URL
2. Secret configured
3. Subscribed events

### Error: Build fails

**Verify**:

1. Environment variables configured
2. Valid `next.config.js`
3. Dependencies installed

### Error: 404 on dynamic routes

**Verify**:

1. Rewrites configuration in `next.config.js`
2. ISR configured correctly

## 📞 Support

### Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Documentation**: https://supabase.com/docs

### Useful Commands

```bash
# View real-time logs
vercel logs --follow

# Rollback
vercel rollback

# Redeploy
vercel --force

# Test locally in production mode
npm run build && npm start
```

## ✅ Final Checklist

Before launch:

- [ ] Tests passing (378)
- [ ] Lighthouse score > 90
- [ ] SSL working
- [ ] Stripe webhook configured
- [ ] Production database
- [ ] Environment variables configured
- [ ] Domain configured
- [ ] Analytics enabled
- [ ] Backup configured (if applicable)

---

**Note**: This is an academic project. For real production, consider:

- Appropriate hosting plan
- Advanced monitoring (Sentry, LogRocket)
- Load tests
- Disaster recovery plan

**Last updated**: 2026-04-01
