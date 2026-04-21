-- SQL CORREGIDO - Verificar y corregir nombres de productos en producción
-- IMPORTANTE: Usar comillas dobles para columnas con camelCase

-- 1. Verificar qué productos están destacados
SELECT 
  id, 
  slug, 
  "nameEs", 
  "nameEn",
  "isFeatured"
FROM products 
WHERE "isFeatured" = true;

-- 2. Si "nameEs" está en inglés o es NULL, copiar desde el campo name (legacy)
-- o actualizar manualmente con los nombres correctos:

-- Ver productos que necesitan corrección (nameEs vacío o en inglés)
SELECT 
  id,
  slug,
  "nameEs",
  "nameEn",
  CASE 
    WHEN "nameEs" IS NULL OR "nameEs" = '' THEN 'nameEs VACÍO'
    WHEN "nameEs" = "nameEn" THEN 'nameEs = nameEn (mismo idioma)'
    ELSE 'OK'
  END as estado
FROM products
WHERE "isFeatured" = true;

-- 3. Para corregir, ejecuta uno por uno con los nombres correctos:
-- (Reemplaza 'product-slug' y 'Nombre en Español' con valores reales)

-- UPDATE products 
-- SET "nameEs" = 'Jarrón Decorativo Floral',
--     "nameEn" = 'Floral Decorative Vase'
-- WHERE slug = 'floral-decorative-vase';

-- Lista de productos destacados con sus nombres correctos:
-- PROD-0002: Organizador de Escritorio Hexagonal / Hexagonal Desk Organizer
-- PROD-0004: Soporte para Teléfono Ajustable / Adjustable Phone Stand  
-- PROD-0005: Figura de Dinosaurio Rex Articulado / Articulated Dinosaur Rex Figure
-- PROD-0008: Coche Clásico Articulado / Articulated Classic Car
-- PROD-0009: Lámpara Luna 3D / 3D Moon Lamp
