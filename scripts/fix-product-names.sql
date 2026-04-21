/**
 * Script SQL para corregir nombres de productos destacados
 * Ejecutar en Supabase SQL Editor si nameEs está en inglés
 */

-- Verificar primero qué productos están destacados y sus nombres
SELECT 
  id, 
  slug, 
  name AS name_legacy,
  nameEs, 
  nameEn,
  isFeatured
FROM products 
WHERE isFeatured = true;

-- Si nameEs está vacío o en inglés, corregir:
-- (Copiar 'name' legacy a 'nameEs' si nameEs está vacío o igual a nameEn)

UPDATE products 
SET 
  nameEs = COALESCE(nameEs, name),  -- Usa nameEs si existe, sino usa name
  nameEn = COALESCE(nameEn, name)   -- Usa nameEn si existe, sino usa name
WHERE isFeatured = true 
  AND (nameEs IS NULL OR nameEs = '' OR nameEs = nameEn);

-- Verificar el resultado
SELECT 
  slug, 
  nameEs, 
  nameEn,
  CASE 
    WHEN nameEs = nameEn THEN '⚠️ IGUALES - necesita corrección'
    ELSE '✅ DIFERENTES - OK'
  END as status
FROM products 
WHERE isFeatured = true;
