-- MIGRACIÓN FINAL - Corregir nombres bilingües basándose en slugs conocidos
-- Ejecutar en Supabase SQL Editor

-- Primero, ver el estado actual
SELECT 
  slug,
  "nameEs",
  "nameEn"
FROM products
WHERE "isFeatured" = true
ORDER BY slug;

-- Si "nameEs" está en inglés, corregir con CASE basado en slug conocido

UPDATE products
SET 
  "nameEs" = CASE slug
    WHEN '3d-moon-lamp' THEN 'Lámpara Luna 3D'
    WHEN 'adjustable-phone-stand' THEN 'Soporte para Teléfono Ajustable'
    WHEN 'articulated-classic-car' THEN 'Coche Clásico Articulado'
    WHEN 'articulated-dinosaur-rex-figure' THEN 'Figura de Dinosaurio Rex Articulado'
    WHEN 'custom-keychain' THEN 'Llavero Personalizado'
    WHEN 'dragon-pencil-holder' THEN 'Porta Lápices Dragón'
    WHEN 'floral-decorative-vase' THEN 'Jarrón Decorativo Floral'
    WHEN 'hexagonal-desk-organizer' THEN 'Organizador de Escritorio Hexagonal'
    WHEN 'house-miniature' THEN 'Miniatura de Casa'
    WHEN 'medieval-secret-box' THEN 'Caja Secreta Medieval'
    WHEN 'minimalist-geometric-planter' THEN 'Macetero Geométrico Minimalista'
    ELSE "nameEs"  -- Mantener valor actual si no coincide
  END,
  "nameEn" = CASE slug
    WHEN '3d-moon-lamp' THEN '3D Moon Lamp'
    WHEN 'adjustable-phone-stand' THEN 'Adjustable Phone Stand'
    WHEN 'articulated-classic-car' THEN 'Articulated Classic Car'
    WHEN 'articulated-dinosaur-rex-figure' THEN 'Articulated Dinosaur Rex Figure'
    WHEN 'custom-keychain' THEN 'Custom Keychain'
    WHEN 'dragon-pencil-holder' THEN 'Dragon Pencil Holder'
    WHEN 'floral-decorative-vase' THEN 'Floral Decorative Vase'
    WHEN 'hexagonal-desk-organizer' THEN 'Hexagonal Desk Organizer'
    WHEN 'house-miniature' THEN 'House Miniature'
    WHEN 'medieval-secret-box' THEN 'Medieval Secret Box'
    WHEN 'minimalist-geometric-planter' THEN 'Minimalist Geometric Planter'
    ELSE "nameEn"
  END
WHERE slug IN (
  '3d-moon-lamp',
  'adjustable-phone-stand',
  'articulated-classic-car',
  'articulated-dinosaur-rex-figure',
  'custom-keychain',
  'dragon-pencil-holder',
  'floral-decorative-vase',
  'hexagonal-desk-organizer',
  'house-miniature',
  'medieval-secret-box',
  'minimalist-geometric-planter'
);

-- Verificar resultado
SELECT 
  slug,
  "nameEs",
  "nameEn",
  CASE 
    WHEN "nameEs" = "nameEn" THEN '⚠️ IGUALES'
    ELSE '✅ DIFERENTES'
  END as status
FROM products
ORDER BY slug;
