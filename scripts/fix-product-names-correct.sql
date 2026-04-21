-- SQL CORREGIDO - Usar comillas dobles para columnas camelCase

-- Verificar primero qué productos están destacados
SELECT 
  id, 
  slug, 
  "nameEs", 
  "nameEn",
  "isFeatured"
FROM products 
WHERE "isFeatured" = true;

-- Si "nameEs" está en inglés, necesitas actualizar manualmente con los nombres españoles:
-- Ejemplo (ajusta según tus productos reales):

-- UPDATE products 
-- SET "nameEs" = 'Flexi Dragón Articulado',
--     "nameEn" = 'Articulated Flexi Dragon'
-- WHERE slug = 'flexi-dragon';

-- UPDATE products 
-- SET "nameEs" = 'Llavero Personalizado',
--     "nameEn" = 'Custom Keychain'
-- WHERE slug = 'custom-keychain';

-- Para ver TODOS los productos y sus nombres:
SELECT slug, "nameEs", "nameEn" 
FROM products 
ORDER BY slug;
