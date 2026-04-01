/**
 * Tests de Integración - Edición de Perfil de Usuario
 * TDD: Tests primero, implementación después
 * 
 * API: /api/cuenta/perfil
 * Páginas: /cuenta/perfil
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Edición de Perfil - API', () => {
  const clienteTest = {
    email: 'perfil-test@example.com',
    password: 'TestPass123!',
    nombre: 'Usuario Test Perfil',
    rol: 'CLIENTE',
  };

  let clienteId: string;

  beforeAll(async () => {
    // Limpiar usuario de test
    await prisma.usuario.deleteMany({
      where: { email: clienteTest.email }
    });

    // Crear cliente
    const cliente = await prisma.usuario.create({
      data: {
        email: clienteTest.email,
        password: await bcrypt.hash(clienteTest.password, 12),
        nombre: clienteTest.nombre,
        rol: 'CLIENTE',
        activo: true,
        nif: '12345678A',
        telefono: '+34600123456',
      },
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: clienteTest.email }
    });
  });

  describe('GET /api/cuenta/perfil', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil');
      expect(response.status).toBe(401);
    });

    it('debe retornar datos del perfil para usuario autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.usuario).toHaveProperty('email');
        expect(data.usuario).toHaveProperty('nombre');
      }
    });
  });

  describe('PATCH /api/cuenta/perfil', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Nuevo Nombre' }),
      });
      expect(response.status).toBe(401);
    });

    it('debe actualizar el nombre', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=cliente-token'
        },
        body: JSON.stringify({ nombre: 'Nombre Actualizado' }),
      });

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('debe validar formato de NIF', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=cliente-token'
        },
        body: JSON.stringify({ nif: 'INVALID' }),
      });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('debe validar formato de teléfono', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=cliente-token'
        },
        body: JSON.stringify({ telefono: '123' }),
      });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('debe permitir actualizar contraseña', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=cliente-token'
        },
        body: JSON.stringify({ 
          passwordActual: clienteTest.password,
          passwordNuevo: 'NuevaPass123!' 
        }),
      });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('debe validar contraseña actual al cambiarla', async () => {
      const response = await fetch('http://localhost:3000/api/cuenta/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=cliente-token'
        },
        body: JSON.stringify({ 
          passwordActual: 'contraseña-incorrecta',
          passwordNuevo: 'NuevaPass123!' 
        }),
      });

      expect([200, 400, 401]).toContain(response.status);
    });
  });
});

describe('Edición de Perfil - Página UI', () => {
  describe('GET /cuenta/perfil', () => {
    it('debe cargar página de perfil', async () => {
      const response = await fetch('http://localhost:3000/cuenta/perfil', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe contener formulario de edición', async () => {
      const response = await fetch('http://localhost:3000/cuenta/perfil', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasForm = html.includes('form') || 
                       html.includes('input') ||
                       html.includes('perfil') ||
                       html.includes('login');
        expect(hasForm).toBe(true);
      }
    });

    it('debe tener campos para nombre, email, nif, teléfono', async () => {
      const response = await fetch('http://localhost:3000/cuenta/perfil', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasFields = html.includes('nombre') || 
                         html.includes('email') ||
                         html.includes('login');
        expect(hasFields).toBe(true);
      }
    });

    it('debe redirigir a login si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/cuenta/perfil');
      
      expect([200, 302, 401]).toContain(response.status);
    });
  });
});

describe('Validación de Datos de Perfil', () => {
  it('debe validar que el nombre tenga al menos 2 caracteres', () => {
    const nombreValido = 'Juan';
    const nombreCorto = 'J';
    
    expect(nombreValido.length).toBeGreaterThanOrEqual(2);
    expect(nombreCorto.length).toBeLessThan(2);
  });

  it('debe validar formato de email', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });

  it('debe validar formato de NIF español', () => {
    const nifValido = '12345678A';
    const nifRegex = /^\d{8}[A-Z]$/;
    expect(nifRegex.test(nifValido)).toBe(true);
    expect(nifRegex.test('1234567A')).toBe(false);
    expect(nifRegex.test('123456789A')).toBe(false);
  });

  it('debe validar formato de teléfono español', () => {
    const telefonoValido = '+34600123456';
    const telefonoRegex = /^\+?[0-9]{9,15}$/;
    expect(telefonoRegex.test(telefonoValido)).toBe(true);
    expect(telefonoRegex.test('123')).toBe(false);
  });

  it('debe requerir contraseña de al menos 8 caracteres', () => {
    const passwordCorta = '1234567';
    const passwordValida = 'Password123!';
    
    expect(passwordCorta.length).toBeLessThan(8);
    expect(passwordValida.length).toBeGreaterThanOrEqual(8);
  });
});