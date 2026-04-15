# Configuración de Bases de Datos - 3D Print TFM

## 📋 Resumen de FASE 1

### ✅ Configuración Verificada

| Archivo      | Entorno    | Host                                   | Status      |
| ------------ | ---------- | -------------------------------------- | ----------- |
| `.env`       | Producción | aws-1-eu-central-1.pooler.supabase.com | ✅ Correcto |
| `.env.local` | Desarrollo | aws-1-eu-west-1.pooler.supabase.com    | ✅ Correcto |
| `.env.test`  | Test       | localhost:5433                         | ✅ Correcto |

### ❌ Problema Identificado

**La tabla 'Return' NO EXISTE en producción**

- 10 migraciones pendientes en producción
- La última vez que se ejecutó seed fue con schema anterior (sin returns)
- Por eso los datos fueron eliminados (alguien ejecutó db:reset o similar)

### 🔧 Solución Requerida

#### Paso 1: Migrar Producción

```bash
# Usar explícitamente .env (producción)
export DATABASE_URL="postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
npx prisma migrate deploy
```

#### Paso 2: Ejecutar Seed en Producción

```bash
# Seed lee automáticamente de .env (producción)
npm run db:seed
```

### 📊 Migraciones Pendientes en Producción

1. `20250415000000_add_returns` - Tabla de devoluciones
2. `20260403174303_init` - Inicialización
3. `20260404190000_add_paypal_fields` - Campos PayPal
4. `20260405000000_add_dimension_fields_cm` - Dimensiones en cm
5. `20260407140349_add_websocket_event_store` - Eventos WebSocket
6. `20260407171645_add_password_history` - Historial contraseñas
7. `20260408153925_add_new_alert_types` - Nuevos tipos alertas
8. `20260408154202_add_alert_fields` - Campos alertas
9. `20260409130154_add_coupon_to_order` - Cupones en pedidos
10. `remove_taxable_amount_and_alerts_seed` - Limpieza

### ⚠️ Comandos Seguros por Entorno

| Comando                     | Entorno Target          | Seguro Ejecutar       |
| --------------------------- | ----------------------- | --------------------- |
| `npm run db:seed`           | Lee de `.env` (prod)    | ✅ Con backup previo  |
| `npm run test:db:seed`      | Forzado a test local    | ✅ Siempre seguro     |
| `npx prisma migrate deploy` | Depende de DATABASE_URL | ⚠️ Verificar antes    |
| `npx prisma db push`        | Depende de DATABASE_URL | ⚠️ Verificar antes    |
| `npx prisma studio`         | Lee de `.env` (prod)    | ✅ Solo visualización |

### 🔒 Seguridad Implementada

- ✅ Scripts de test fuerzan DATABASE_URL a localhost
- ✅ Archivos .env.example no tienen credenciales reales
- ✅ Validación de BD antes de migraciones
- ✅ Backups automáticos en Supabase (diarios)

---

**FASE 1 completada:** Configuración verificada y documentada.
**Próximo paso:** FASE 2 - Migrar y repoblar producción.
