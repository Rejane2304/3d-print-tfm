# 🔒 Database Safety Guidelines

## ⚠️ CRÍTICO: Prisma CLI Behavior

**Prisma CLI SIEMPRE lee `.env` antes de cualquier otra configuración.**

Esto significa que:

- `DATABASE_URL="...dev..." npx prisma db push` **NO funciona como esperas**
- Prisma ignora la variable y usa `.env` (producción)

## ✅ Forma Segura de Operar

### Para Desarrollo

```bash
# 1. Renombrar temporalmente .env
mv .env .env.prod.backup

# 2. Ejecutar operaciones (ahora usará .env.local)
npx prisma db push
npm run db:seed

# 3. Restaurar .env de producción
mv .env.prod.backup .env
```

### Para Test (siempre seguro)

```bash
npm run test:db:seed  # Ya está configurado para usar localhost:5433
```

### Para Producción (REQUIERE CONFIRMACIÓN)

```bash
# NUNCA ejecutar sin verificar primero
source scripts/check-db-env.sh
# Esto bloqueará si detecta producción
```

## 🚫 Operaciones PROHIBIDAS en Producción

- `npx prisma migrate reset`
- `npx prisma db push --force`
- `npm run db:reset`
- Cualquier operación que elimine datos

## ✅ Operaciones Permitidas

- `npx prisma migrate deploy` (solo aplicar migraciones)
- `npx prisma generate` (generar cliente)
- `npx prisma studio` (solo visualización)

## 📞 En Caso de Emergencia

Si accidentalmente modificaste producción:

1. NO ejecutes más comandos
2. Contacta inmediatamente al administrador de BD
3. Supabase tiene backups automáticos diarios

---

**Última actualización:** 2026-04-15
**Incidentes:** 2 (producción borrada accidentalmente)
