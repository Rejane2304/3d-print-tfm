-- Script de inicialización para BD de tests
-- Este archivo se ejecuta automáticamente cuando PostgreSQL inicia

-- Crear la base de datos de tests
CREATE DATABASE "3dprint_tfm_test" OWNER postgres;

-- Crear el usuario de tests
CREATE USER testuser WITH PASSWORD 'testpassword123';

-- Otorgar permisos al usuario
ALTER USER testuser SUPERUSER;
ALTER USER testuser CREATEDB;

-- Conectarse a la BD de tests y otorgar permisos
\connect 3dprint_tfm_test postgres

-- Otorgar todos los permisos en la BD
GRANT ALL PRIVILEGES ON DATABASE "3dprint_tfm_test" TO testuser;
GRANT ALL PRIVILEGES ON SCHEMA public TO testuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO testuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO testuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO testuser;

-- Verificar que la BD está lista
SELECT 'Database initialization complete' as status;
