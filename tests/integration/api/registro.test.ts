/**
 * Tests de Integración - API de Register
 * POST /api/auth/register
 * 
 * NOTA: Tests de validación pura (email, contraseña, teléfono)
 * están en tests/unit/validaciones.test.ts
 * Este archivo testea comportamiento de integración con BD.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db/prisma';

describe('POST /api/auth/register', () => {
  let datosValidos: any;

  beforeEach(async () => {
    // Generar email único con timestamp
    datosValidos = {
      nombre: 'Juan Pérez',
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: 'Password123!',
      confirmarPassword: 'Password123!',
      telefono: '+34 600 123 456',
    };
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
      expect(body.usuario.password).toBeUndefined();
    });

    it('debe guardar email en minúsculas', async () => {
      const emailUpper = `TEST-${Date.now()}@EXAMPLE.COM`;
      const req = createRequest({ ...datosValidos, email: emailUpper });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.usuario.email).toBe(emailUpper.toLowerCase());
    });

    it('debe hashear la contraseña', async () => {
      const req = createRequest(datosValidos);
      await POST(req);

      const usuario = await prisma.user.findUnique({
        where: { email: datosValidos.email.toLowerCase() },
      });

      expect(usuario).toBeDefined();
      expect(usuario!.password).not.toBe(datosValidos.password);
      expect(usuario!.password).toMatch(/^\$2[aby]\$/);
    });

    it('debe asignar rol CLIENTE por defecto', async () => {
      const req = createRequest(datosValidos);
      await POST(req);

      const usuario = await prisma.user.findUnique({
        where: { email: datosValidos.email.toLowerCase() },
      });

      expect(usuario!.rol).toBe('CLIENTE');
    });

    it('debe activar usuario por defecto', async () => {
      const req = createRequest(datosValidos);
      await POST(req);

      const usuario = await prisma.user.findUnique({
        where: { email: datosValidos.email.toLowerCase() },
      });

      expect(usuario!.activo).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    it('debe rechazar email duplicado', async () => {
      // Crear usuario primero
      const req1 = createRequest(datosValidos);
      const res1 = await POST(req1);
      expect(res1.status).toBe(201);

      // Intentar crear duplicado
      const req2 = createRequest({
        ...datosValidos,
        nombre: 'Otro Nombre',
      });
      const res2 = await POST(req2);
      const body2 = await res2.json();

      expect(res2.status).toBe(409);
      expect(body2.success).toBe(false);
      expect(body2.error).toContain('Ya existe');
    }, 15000);

    // Los tests de validación (email inválido, contraseña débil, etc.)
    // están en tests/unit/validaciones.test.ts
    // Aquí solo testeamos comportamiento de BD y API
  });
});

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
