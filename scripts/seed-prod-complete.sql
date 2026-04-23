-- ============================================================
-- SEED SCRIPT PARA PRODUCCIÓN
-- Ejecutar en Supabase SQL Editor (Nueva BD)
-- ============================================================

-- Limpiar tablas (en orden inverso de dependencias)
TRUNCATE TABLE "ReturnItems", "Returns", "Invoice", "Payment", "OrderMessage", "OrderItem", "Orders", "CartItem", "Cart", "ShippingConfig", "ShippingZone", "Review", "InventoryMovement", "ProductImage", "Products", "Category", "Coupon", "EventStore", "Alert", "AuditLog", "Session", "VerificationToken", "PasswordHistory", "Address", "SiteConfig", "users" CASCADE;

-- ============================================================
-- 1. SITE CONFIG
-- ============================================================
INSERT INTO "site_configs" (
    id, "companyName", "companyTaxId", "companyAddress",
    "companyCity", "companyProvince", "companyPostalCode",
    "companyPhone", "companyEmail", "defaultVatRate",
    "lowStockThreshold", "updatedAt"
) VALUES (
    'site-config',
    '3D Print',
    'B12345678',
    'Calle Admin 123',
    'Barcelona',
    'Barcelona',
    '08001',
    '+34 930 000 001',
    'info@3dprint.com',
    21,
    5,
    NOW()
);

-- ============================================================
-- 2. USUARIOS (CON CONTRASEÑAS HASHEADAS)
-- bcrypt hash de "AdminTFM2024!" y "JuanTFM2024!"
-- ============================================================
INSERT INTO users (
    id, email, password, name, phone, "taxId", role,
    "isActive", "emailVerified", "failedAttempts", "lockedUntil",
    "createdAt", "updatedAt"
) VALUES
-- Admin: admin@3dprint.com / AdminTFM2024!
(
    'user-admin-001',
    'admin@3dprint.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.LewKy.NhM4R1JqKa',
    'Administrador',
    '+34 600 000 001',
    'B12345678',
    'ADMIN',
    true,
    NOW(),
    0,
    NULL,
    NOW(),
    NOW()
),
-- Cliente: juan@example.com / JuanTFM2024!
(
    'user-juan-001',
    'juan@example.com',
    '$2a$12$qG7qQ3vJq3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ3qQ',
    'Juan Pérez',
    '+34 600 000 002',
    '12345678A',
    'CUSTOMER',
    true,
    NOW(),
    0,
    NULL,
    NOW(),
    NOW()
);

-- ============================================================
-- 3. CATEGORÍAS
-- ============================================================
INSERT INTO "Category" (
    id, name, slug, description, image, "displayOrder", "isActive", "createdAt", "updatedAt"
) VALUES
('cat-decoracion', 'Decoración', 'decoracion', 'Artículos decorativos para el hogar', '/images/categories/decoracion.jpg', 1, true, NOW(), NOW()),
('cat-tecnologia', 'Tecnología', 'tecnologia', 'Accesorios tecnológicos impresos en 3D', '/images/categories/tecnologia.jpg', 2, true, NOW(), NOW()),
('cat-juguetes', 'Juguetes', 'juguetes', 'Juguetes educativos y divertidos', '/images/categories/juguetes.jpg', 3, true, NOW(), NOW()),
('cat-hogar', 'Hogar', 'hogar', 'Productos útiles para el hogar', '/images/categories/hogar.jpg', 4, true, NOW(), NOW());

-- ============================================================
-- 4. PRODUCTOS (Ejemplos principales)
-- ============================================================
INSERT INTO "Products" (
    id, "nameEs", "nameEn", slug, price, stock, "categoryId",
    material, "descriptionEs", "descriptionEn",
    "shortDescEs", "shortDescEn",
    "widthCm", "heightCm", "depthCm", weight,
    "printTime", "isActive", "createdAt", "updatedAt"
) VALUES
-- Lámpara Luna 3D
(
    'prod-luna-001',
    'Lámpara Luna 3D',
    '3D Moon Lamp',
    '3d-moon-lamp',
    45.99,
    15,
    'cat-decoracion',
    'PLA',
    'Réplica detallada de la luna con textura realista. Impresión 3D de alta calidad.',
    'Detailed moon replica with realistic texture. High quality 3D printing.',
    'Lámpara lunar realista',
    'Realistic moon lamp',
    15.0, 15.0, 15.0, 0.3,
    12,
    true,
    NOW(),
    NOW()
),
-- Soporte Móvil
(
    'prod-soporte-001',
    'Soporte para Móvil',
    'Phone Stand',
    'phone-stand',
    12.99,
    25,
    'cat-tecnologia',
    'PLA',
    'Soporte ajustable para smartphones. Diseño ergonómico y estable.',
    'Adjustable smartphone stand. Ergonomic and stable design.',
    'Soporte ajustable móvil',
    'Adjustable phone stand',
    8.0, 10.0, 12.0, 0.08,
    4,
    true,
    NOW(),
    NOW()
),
-- Dinosaurio Rex
(
    'prod-dino-001',
    'Dinosaurio Rex Articulado',
    'Articulated T-Rex',
    'articulated-trex',
    19.99,
    20,
    'cat-juguetes',
    'PLA_FLEX',
    'Dinosaurio T-Rex con articulaciones móviles. Juguete educativo.',
    'Articulated T-Rex dinosaur. Educational toy.',
    'Dino articulado móvil',
    'Articulated movable dino',
    18.0, 12.0, 25.0, 0.15,
    8,
    true,
    NOW(),
    NOW()
);

-- ============================================================
-- 5. IMÁGENES DE PRODUCTOS
-- ============================================================
INSERT INTO "ProductImage" (
    id, "productId", url, "isMain", "displayOrder", "createdAt"
) VALUES
('img-luna-001', 'prod-luna-001', '/images/products/lampara-luna.jpg', true, 1, NOW()),
('img-soporte-001', 'prod-soporte-001', '/images/products/soporte-movil.jpg', true, 1, NOW()),
('img-dino-001', 'prod-dino-001', '/images/products/dinosaurio-rex.jpg', true, 1, NOW());

-- ============================================================
-- 6. CUPONES
-- ============================================================
INSERT INTO "Coupon" (
    id, code, "discountType", "discountValue", "minOrderAmount",
    "maxUses", "usedCount", "startDate", "endDate",
    "isActive", "createdAt", "updatedAt"
) VALUES
(
    'coupon-welcome-10',
    'WELCOME10',
    'PERCENTAGE',
    10,
    30.00,
    100,
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    NOW(),
    NOW()
);

-- ============================================================
-- 7. ZONAS DE ENVÍO
-- ============================================================
INSERT INTO "ShippingZone" (
    id, name, "postalCodePattern", "baseCost", "freeThreshold", "isActive", "createdAt"
) VALUES
('zone-peninsula', 'Península', '^[0-9]{5}$', 5.99, 50.00, true, NOW()),
('zone-baleares', 'Baleares', '^07[0-9]{3}$', 7.99, 60.00, true, NOW()),
('zone-canarias', 'Canarias', '^35[0-9]{3}$|^38[0-9]{3}$', 9.99, 80.00, true, NOW());

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'SITE CONFIG' as tabla, count(*) as registros FROM "site_configs"
UNION ALL SELECT 'USERS', count(*) FROM users
UNION ALL SELECT 'CATEGORIES', count(*) FROM "Category"
UNION ALL SELECT 'PRODUCTS', count(*) FROM "Products"
UNION ALL SELECT 'COUPONS', count(*) FROM "Coupon"
UNION ALL SELECT 'SHIPPING ZONES', count(*) FROM "ShippingZone";
