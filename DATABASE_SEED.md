# 🌱 Base de Datos de Desarrollo - Seed Data

## Problema Identificado

La BD de desarrollo estaba **completamente vacía** después de las migraciones.

### Causa Raíz

- El script de seed (`prisma/seed.ts`) existía pero **nunca se había ejecutado**
- Los archivos CSV con datos estaban presentes en `public/data/`
- El seed no se ejecutaba automáticamente, requería ejecución manual

## Solución Implementada

### Ejecutar el Seed

```bash
npm run db:seed
```

Este comando:
1. ✅ Lee los archivos CSV desde `public/data/`
2. ✅ Limpia la BD de desarrollo (TRUNCATE de todas las tablas)
3. ✅ Crea 10 usuarios desde `users.csv`
4. ✅ Crea 10 productos desde `products.csv`
5. ✅ Crea 10 pedidos desde `orders.csv`
6. ✅ Crea 8 alertas desde `alerts.csv`
7. ✅ Relaciona correctamente todas las tablas

### Datos Insertados

```
📊 Resumen del Seed:
   - Usuarios: 10 (usuarios de prueba con emails @example.com)
   - Productos: 10 (productos con imágenes e información completa)
   - Pedidos: 10 (pedidos de clientes con detalles de envío)
   - Alertas: 8 (alertas del sistema)
   - Direcciones: Incluidas con usuarios
   - Items de Pedidos: Incluidos con pedidos
```

## Usuarios de Prueba Disponibles

Después de ejecutar el seed, estos usuarios están disponibles:

| Email | Rol | Password |
|-------|-----|----------|
| juan@example.com | CLIENTE | pass123 |
| maria@example.com | CLIENTE | pass123 |
| carlos@example.com | CLIENTE | pass123 |
| admin@example.com | ADMIN | admin123 |
| (y 6 más) | CLIENTE | pass123 |

## Archivos de Datos CSV

```
public/data/
├── users.csv                    # 10 usuarios
├── products.csv                 # 10 productos
├── orders.csv                   # 10 pedidos
├── order_items.csv             # Items en los pedidos
├── payments.csv                # Pagos asociados
├── alerts.csv                  # 8 alertas
└── inventory_movements.csv      # Movimientos de inventario
```

## Cómo Reiniciar la BD

Si necesitas limpiar y repoblar la BD de desarrollo:

```bash
# Opción 1: Solo seed (preserva estructura)
npm run db:seed

# Opción 2: Reset completo (migraciones + seed)
npm run db:reset
```

### ⚠️ Advertencia

**`db:reset` ejecutará `TRUNCATE CASCADE` en TODAS las tablas.**

Esto borrará:
- Todos los usuarios
- Todos los productos
- Todos los pedidos
- Todos los datos personalizados

Use solo si sabe que está bien perder los datos.

## Scripts Relacionados

```bash
# BD Desarrollo
npm run db:seed           # Ejecutar seed
npm run db:reset          # Reset completo (migrate + seed)

# BD Tests (Docker)
npm run test:docker:setup # Docker + migraciones + seed
npm run test:db:seed      # Solo seed en tests
npm run test:db:migrate   # Solo migraciones en tests
```

## Validación

Para verificar que el seed se ejecutó correctamente:

```bash
# Conectarse a la BD de Supabase y ejecutar:
SELECT COUNT(*) FROM usuarios;      -- Debe retornar 10
SELECT COUNT(*) FROM productos;     -- Debe retornar 10
SELECT COUNT(*) FROM pedidos;       -- Debe retornar 10
SELECT COUNT(*) FROM alertas;       -- Debe retornar 8
```

## Notas Importantes

1. **El seed TRUNCATE la BD** - Borra todos los datos antes de insertar nuevos
2. **Ejecutar con cuidado en producción** - Nunca ejecutes en BD de producción
3. **Los datos son de prueba** - Emails ficticios, direcciones de prueba
4. **Compatible con tests** - Los tests limpian solo usuarios con prefijo `test-`

---

**Estado Actual:** ✅ BD de desarrollo poblada con datos de prueba
