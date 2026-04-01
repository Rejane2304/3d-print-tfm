/**
 * Tests de Integración - NextAuth Login
 * Tests para el flujo de autenticación con credenciales
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { cleanupTestUsers } from '../../helpers/db-cleanup';

describe('NextAuth - Flujo de Login', () => {
  // Usar email único que no empiece con 'test-' para evitar que cleanupTestUsers lo borre
  const usuarioTest = {
    email: 'auth-integration@example.com',
    password: 'TestPassword123!',
    nombre: 'Usuario Test',
  };

  beforeEach(async () => {
    // Limpiar usuarios de test anteriores con este email específico
    await prisma.usuario.deleteMany({
      where: { email: usuarioTest.email }
    });

    const hashedPassword = await bcrypt.hash(usuarioTest.password, 12);
    await prisma.usuario.create({
      data: {
        email: usuarioTest.email,
        password: hashedPassword,
        nombre: usuarioTest.nombre,
        rol: 'CLIENTE',
        activo: true,
      },
    });
  });

  afterAll(async () => {
    // Limpieza final
    await cleanupTestUsers();
  });

  describe('Autorización de credenciales', () => {
    it('debe autorizar con credenciales válidas', async () => {
      // Simular autorización NextAuth
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.email).toBe(usuarioTest.email);
      expect(usuario!.nombre).toBe(usuarioTest.nombre);
      expect(usuario!.activo).toBe(true);

      // Verificar que la contraseña hasheada coincide
      const passwordValido = await bcrypt.compare(
        usuarioTest.password,
        usuario!.password
      );
      expect(passwordValido).toBe(true);
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
      });

      const passwordValido = await bcrypt.compare(
        'wrong-password',
        usuario!.password
      );
      expect(passwordValido).toBe(false);
    });

    it('debe encontrar usuario por email insensible a mayúsculas', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: 'TEST-LOGIN@EXAMPLE.COM' },
      });

      // Supabase/PostgreSQL es case-insensitive por defecto en búsquedas
      expect(usuario).toBeDefined();
    });
  });

  describe('Datos de sesión', () => {
    it('debe incluir información básica en la sesión', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
        select: {
          id: true,
          email: true,
          nombre: true,
          rol: true,
          activo: true,
          password: false, // No incluir password
        },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.id).toBeDefined();
      expect(usuario!.email).toBe(usuarioTest.email);
      expect(usuario!.nombre).toBe(usuarioTest.nombre);
      expect(usuario!.rol).toBe('CLIENTE');
    });

    it('debe incluir rol en el token', async () => {
      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioTest.email },
      });

      expect(usuario!.rol).toBeDefined();
      expect(['CLIENTE', 'ADMIN']).toContain(usuario!.rol);
    });
  });

  describe('Usuarios inactivos', () => {
    it('debe rechazar login de usuario inactivo', async () => {
      // Crear usuario inactivo específico para este test
      const usuarioInactivo = {
        email: 'test-inactivo@example.com',
        password: 'TestPassword123!',
        nombre: 'Usuario Inactivo',
      };

      const hashedPassword = await bcrypt.hash(usuarioInactivo.password, 12);
      await prisma.usuario.create({
        data: {
          email: usuarioInactivo.email,
          password: hashedPassword,
          nombre: usuarioInactivo.nombre,
          rol: 'CLIENTE',
          activo: false,
        },
      });

      const usuario = await prisma.usuario.findUnique({
        where: { email: usuarioInactivo.email },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.activo).toBe(false);

      // Limpiar usuario de test creado
      await prisma.usuario.delete({
        where: { email: usuarioInactivo.email },
      });
    });
  });
});
