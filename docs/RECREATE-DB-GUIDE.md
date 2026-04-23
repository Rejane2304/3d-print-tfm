# 🔄 GUÍA: Recrear Base de Datos de Producción

## PASO 1: Crear Nueva BD en Supabase

1. Ve a https://app.supabase.com
2. Click **"New Project"**
3. Configuración:
   - **Organization:** Tu organización
   - **Project name:** `3d-print-tfm-prod` (o el que prefieras)
   - **Database Password:** Genera una segura (guarda en 1Password)
   - **Region:** `West Europe (Frankfurt)` (eu-central-1) - más cercano a Vercel
4. Click **"Create new project"**
5. Espera ~2 minutos a que se cree

## PASO 2: Obtener DATABASE_URL

1. En tu nuevo proyecto Supabase, ve a **Settings → Database**
2. Busca **"Connection string"**
3. Selecciona **URI** y copia la cadena
4. Será algo como:
   ```
   postgresql://postgres:PASSWORD@db-XXXXXXXX.supabase.co:5432/postgres
   ```

## PASO 3: Ejecutar Seed SQL

1. En Supabase, ve a **SQL Editor → New query**
2. Copia el contenido de `scripts/seed-prod-complete.sql`
3. Pega en el editor
4. Click **"Run"**
5. Verifica que todas las tablas tengan datos (debe mostrar 6 filas con conteos)

## PASO 4: Actualizar Vercel

1. Ve a https://vercel.com/dashboard → Tu proyecto → **Settings**
2. Ve a **Environment Variables**
3. Actualiza estas variables:

   ```
   DATABASE_URL=postgresql://postgres:PASSWORD@db-XXXXXXXX.supabase.co:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:PASSWORD@db-XXXXXXXX.supabase.co:5432/postgres
   ```

4. Click **"Save"**
5. Ve a **Deployments**
6. Busca el último deploy y click **"Redeploy"**

## PASO 5: Verificación (2-3 minutos después del deploy)

1. **Health Check:**

   ```
   https://3d-print-tfm.vercel.app/api/health
   ```

   Debe devolver: `{"database": true, ...}`

2. **Login Admin:**
   - Ve a `/auth`
   - Email: `admin@3dprint.com`
   - Password: `AdminTFM2024!`

3. **Verificar Productos:**
   - Ve a `/products`
   - Deben verse los 3 productos

4. **Añadir al Carrito:**
   - Intenta añadir un producto
   - El carrito debe funcionar

## 🧹 Limpieza Final

Una vez verificado todo, eliminar archivos temporales:

```bash
rm scripts/seed-prod-complete.sql
rm scripts/diagnose-prod-db.sh
rm scripts/seed-prod.sql
rm public/sw.js.disabled
git add .
git commit -m "chore: cleanup temporary files after DB recreation"
git push
```

## 🆘 Si Algo Falla

### Error "relation does not exist"

- Las tablas no se crearon. Ejecuta: `npx prisma migrate deploy`

### Error de autenticación

- Verifica que las contraseñas hasheadas estén correctas en el SQL

### Error de conexión

- Verifica que la DATABASE_URL no tenga espacios ni saltos de línea
- Asegúrate de usar el puerto 6543 para DATABASE_URL (pgbouncer)

## 📞 Credenciales de Prueba

| Email             | Password      | Rol      |
| ----------------- | ------------- | -------- |
| admin@3dprint.com | AdminTFM2024! | ADMIN    |
| juan@example.com  | JuanTFM2024!  | CUSTOMER |

---

**Tiempo estimado total:** 15-20 minutos
