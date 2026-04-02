/**
 * Tests de Integración - API de Register
 * POST /api/auth/register
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db/prisma';
import { cleanupTestUsers } from '../../helpers/db-cleanup';

describe('POST /api/auth/register', () => {
  let datosValidos: any;

  beforeEach(async () => {
    // Generar email único con timestamp para evitar conflictos
    datosValidos = {
      nombre: 'Juan Pérez',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      confirmarPassword: 'Password123!',
      telefono: '+34 600 123 456',
    };
  });

  afterAll(async () => {
    // Limpieza final: eliminar SOLO usuarios de test (con prefijo test-)
    await cleanupTestUsers();
  });

  describe('Validación de datos', () => {
    it('debe rechazar registro sin nombre', async () => {
      const req = createRequest({ ...datosValidos, nombre: '' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('nombre');
    });

    it('debe rechazar registro sin email', async () => {
      const req = createRequest({ ...datosValidos, email: '' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('email');
    });

    it('debe rechazar email inválido', async () => {
      const req = createRequest({ ...datosValidos, email: 'email-invalido' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('email');
    });

    it('debe rechazar contraseña débil', async () => {
      const req = createRequest({ ...datosValidos, password: '123' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('debe rechazar teléfono inválido', async () => {
      const req = createRequest({ ...datosValidos, telefono: '123' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('Registro exitoso', () => {
    it('debe crear usuario con datos válidos', async () => {
      const req = createRequest(datosValidos);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.usuario).toBeDefined();
      expect(body.usuario.email).toBe(datosValidos.email.toLowerCase());
      expect(body.usuario.nombre).toBe(datosValidos.nombre);
      expect(body.usuario.password).toBeUndefined(); // No devolver password
    });

    it('debe guardar email en minúsculas', async () => {
      // Generar email único con timestamp para evitar conflictos
      const uniqueEmail = `TEST-${Date.now()}@EXAMPLE.COM`;
      const expectedEmail = uniqueEmail.toLowerCase();
      
      const req = createRequest({
        ...datosValidos,
        email: uniqueEmail,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.usuario.email).toBe(expectedEmail);
    });

    it('debe hashear la contraseña', async () => {
      const emailUnico = `test-hash-${Date.now()}@example.com`;
      const datosTest = { ...datosValidos, email: emailUnico };
      const req = createRequest(datosTest);
      const res = await POST(req);
      
      expect(res.status).toBe(201);

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailUnico.toLowerCase() },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.password).not.toBe(datosTest.password);
      expect(usuario!.password).toMatch(/^\$2[aby]\$/); // Formato bcrypt
    });

    it('debe asignar rol CLIENTE por defecto', async () => {
      const emailUnico = `test-rol-${Date.now()}@example.com`;
      const datosTest = { ...datosValidos, email: emailUnico };
      const req = createRequest(datosTest);
      const res = await POST(req);
      
      expect(res.status).toBe(201);

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailUnico.toLowerCase() },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.rol).toBe('CLIENTE');
    });

    it('debe activar usuario por defecto', async () => {
      const emailUnico = `test-activo-${Date.now()}@example.com`;
      const datosTest = { ...datosValidos, email: emailUnico };
      const req = createRequest(datosTest);
      const res = await POST(req);
      
      expect(res.status).toBe(201);

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailUnico.toLowerCase() },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.activo).toBe(true);
    });
  });

  describe('Manejo de duplicados', () => {
    it('debe rechazar email duplicado', async () => {
      // Crear usuario primero
      const req1 = createRequest(datosValidos);
      await POST(req1);

      // Intentar crear duplicado
      const req2 = createRequest({
        ...datosValidos,
        nombre: 'Otro Nombre',
      });
      const res = await POST(req2);
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Ya existe');
    });
  });
});

// Helper para crear requests
function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
