-- Seed SQL para Producción
-- Ejecutar en Supabase SQL Editor (Producción)
-- ⚠️ SOLO EJECUTAR SI LA BD ESTÁ VACÍA

-- Insertar usuario admin
INSERT INTO users (
    id, email, password, name, role, "isActive", "emailVerified", 
    "failedAttempts", "createdAt", "updatedAt"
) VALUES (
    'user-admin-001',
    'admin@3dprint.com',
    '$2a$10$YourHashedPasswordHere', -- Necesitas hash real de bcrypt
    'Administrador',
    'ADMIN',
    true,
    NOW(),
    0,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insertar site config
INSERT INTO site_configs (
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
) ON CONFLICT (id) DO NOTHING;

-- Verificar inserciones
SELECT 'Usuarios:' as check_type, count(*) as count FROM users
UNION ALL
SELECT 'SiteConfig:', count(*) FROM site_configs;
