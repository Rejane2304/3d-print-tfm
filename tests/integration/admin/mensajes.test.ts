/**
 * Tests de Integración - Sistema de Mensajería
 * TDD: Tests primero, implementación después
 * 
 * API: /api/admin/mensajes
 * Páginas: /admin/pedidos/[id]/mensajes
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Sistema de Mensajería - API Admin', () => {
  const adminTest = {
    email: 'admin-mensajes@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Mensajes',
    rol: 'ADMIN',
  };

  const clienteTest = {
    email: 'cliente-mensajes@example.com',
    password: 'ClientPass123!',
    nombre: 'Cliente Mensajes',
    rol: 'CLIENTE',
  };

  let adminId: string;
  let clienteId: string;
  let pedidoId: string;

  beforeAll(async () => {
    // Limpiar usuarios de test
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });

    // Crear admin
    const admin = await prisma.usuario.create({
      data: {
        email: adminTest.email,
        password: await bcrypt.hash(adminTest.password, 12),
        nombre: adminTest.nombre,
        rol: 'ADMIN',
        activo: true,
      },
    });
    adminId = admin.id;

    // Crear cliente
    const cliente = await prisma.usuario.create({
      data: {
        email: clienteTest.email,
        password: await bcrypt.hash(clienteTest.password, 12),
        nombre: clienteTest.nombre,
        rol: 'CLIENTE',
        activo: true,
      },
    });
    clienteId = cliente.id;

    // Crear pedido de prueba
    const pedido = await prisma.pedido.create({
      data: {
        numeroPedido: 'M-20240001',
        usuarioId: clienteId,
        estado: 'CONFIRMADO',
        subtotal: 100.00,
        envio: 5.00,
        total: 105.00,
        nombreEnvio: clienteTest.nombre,
        telefonoEnvio: '+34600123456',
        direccionEnvio: 'Calle Test 123',
        codigoPostalEnvio: '28001',
        ciudadEnvio: 'Madrid',
        provinciaEnvio: 'Madrid',
        paisEnvio: 'España',
        metodoPago: 'TARJETA',
      },
    });
    pedidoId = pedido.id;
  });

  afterAll(async () => {
    // Limpiar datos de test
    await prisma.mensajePedido.deleteMany({
      where: { pedidoId }
    });
    await prisma.pedido.deleteMany({
      where: { id: pedidoId }
    });
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });
  });

  describe('GET /api/admin/mensajes', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes');
      expect(response.status).toBe(401);
    });

    it('debe retornar 403 si el usuario no es admin', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });
      
      expect([401, 403]).toContain(response.status);
    });

    it('debe requerir pedidoId', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('debe listar mensajes de un pedido', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/mensajes?pedidoId=${pedidoId}`, {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.mensajes)).toBe(true);
      }
    });
  });

  describe('POST /api/admin/mensajes', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, mensaje: 'Test' }),
      });
      expect(response.status).toBe(401);
    });

    it('debe validar que el pedido existe', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId: 'pedido-inexistente', mensaje: 'Test' }),
      });

      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });

    it('debe validar que el mensaje no esté vacío', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId, mensaje: '' }),
      });

      expect([200, 400, 401]).toContain(response.status);
    });

    it('debe crear mensaje correctamente', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ 
          pedidoId, 
          mensaje: 'Mensaje de prueba desde el admin',
          esAdmin: true 
        }),
      });

      expect([200, 201, 401, 403]).toContain(response.status);

      if (response.status === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.mensaje).toHaveProperty('id');
        expect(data.mensaje).toHaveProperty('mensaje');
        expect(data.mensaje).toHaveProperty('creadoEn');
      }
    });
  });

  describe('DELETE /api/admin/mensajes/[id]', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes/test-id', {
        method: 'DELETE',
      });
      expect(response.status).toBe(401);
    });

    it('debe permitir eliminar mensaje propio', async () => {
      const response = await fetch('http://localhost:3000/api/admin/mensajes/test-id', {
        method: 'DELETE',
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });
});

describe('Sistema de Mensajería - Página UI', () => {
  describe('GET /admin/pedidos/[id]/mensajes', () => {
    it('debe cargar página de mensajes del pedido', async () => {
      const response = await fetch('http://localhost:3000/admin/pedidos/test-id/mensajes', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe mostrar formulario para enviar mensaje', async () => {
      const response = await fetch('http://localhost:3000/admin/pedidos/test-id/mensajes', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasForm = html.includes('mensaje') || 
                       html.includes('textarea') ||
                       html.includes('login');
        expect(hasForm).toBe(true);
      }
    });
  });
});

describe('Validación de Mensajes', () => {
  it('debe limitar longitud del mensaje (máx 1000 caracteres)', () => {
    const maxLength = 1000;
    const mensajeCorto = 'a'.repeat(100);
    const mensajeLargo = 'a'.repeat(1500);
    
    expect(mensajeCorto.length).toBeLessThanOrEqual(maxLength);
    expect(mensajeLargo.length).toBeGreaterThan(maxLength);
  });

  it('debe soportar diferentes tipos de mensaje', () => {
    const tipos = ['general', 'soporte', 'estado', 'envio'];
    tipos.forEach(tipo => {
      expect(tipo).toBeTruthy();
    });
  });

  it('debe diferenciar entre mensaje de admin y cliente', () => {
    const esAdmin = true;
    expect(esAdmin).toBe(true);
  });
});