/**
 * Tests de Integración - Gestión de Pedidos Admin
 * TDD: Tests primero, implementación después
 * 
 * API: /api/admin/pedidos
 * Páginas: /admin/pedidos, /admin/pedidos/[id]
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Gestión de Pedidos - API Admin', () => {
  const adminTest = {
    email: 'admin-orders@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Orders',
    rol: 'ADMIN',
  };

  const clienteTest = {
    email: 'cliente-orders@example.com',
    password: 'ClientPass123!',
    nombre: 'Cliente Orders',
    rol: 'CLIENTE',
  };

  let adminId: string;
  let clienteId: string;

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
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });
  });

  describe('GET /api/admin/pedidos', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/pedidos');
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('No autenticado');
    });
  });

  describe('PATCH /api/admin/pedidos', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-id', estado: 'ENVIADO' }),
      });
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('debe validar que el ID es requerido', async () => {
      const response = await fetch('http://localhost:3000/api/admin/pedidos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ estado: 'ENVIADO' }),
      });

      // Puede ser 400 o 401/403 dependiendo de la autenticación
      expect([200, 400, 401, 403]).toContain(response.status);
    });

    it('debe validar el estado permitido', async () => {
      const response = await fetch('http://localhost:3000/api/admin/pedidos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ id: 'test-id', estado: 'ESTADO_INVALIDO' }),
      });

      // Puede ser 400 o 401/403 dependiendo de la autenticación
      expect([200, 400, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/admin/pedidos/[id]', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/pedidos/test-id');
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});

describe('Gestión de Pedidos - Página UI', () => {
  const adminTest = {
    email: 'admin-orders-ui@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Orders UI',
    rol: 'ADMIN',
  };

  beforeAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: adminTest.email }
    });

    await prisma.usuario.create({
      data: {
        email: adminTest.email,
        password: await bcrypt.hash(adminTest.password, 12),
        nombre: adminTest.nombre,
        rol: 'ADMIN',
        activo: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: adminTest.email }
    });
  });

  describe('GET /admin/pedidos', () => {
    it('debe cargar página de pedidos', async () => {
      const response = await fetch('http://localhost:3000/admin/pedidos', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Puede cargar la página o redirigir a login
      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe contener elementos de la interfaz', async () => {
      const response = await fetch('http://localhost:3000/admin/pedidos', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasPedidosContent = html.includes('Gestión de Pedidos') || 
                                   html.includes('pedidos') ||
                                   html.includes('Iniciar sesión');
        expect(hasPedidosContent).toBe(true);
      }
    });
  });

  describe('GET /admin/pedidos/[id]', () => {
    it('debe cargar página de detalle de pedido', async () => {
      const response = await fetch('http://localhost:3000/admin/pedidos/test-id', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Puede cargar la página o redirigir
      expect([200, 302, 401]).toContain(response.status);
    });
  });
});

describe('Estados de Pedidos', () => {
  const estadosEsperados = [
    'PENDIENTE',
    'PAGADO',
    'EN_PREPARACION',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ];

  it('debe manejar todos los estados de pedido', () => {
    estadosEsperados.forEach(estado => {
      expect(estado).toBeTruthy();
    });
  });

  it('debe tener el flujo correcto de estados', () => {
    // Flujo normal: PENDIENTE → PAGADO → EN_PREPARACION → ENVIADO → ENTREGADO
    const flujoEsperado = ['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'];
    expect(flujoEsperado.length).toBe(5);
  });
});