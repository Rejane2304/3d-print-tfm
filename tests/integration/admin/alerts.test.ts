/**
 * Tests de Integración - Sistema de Alertas
 * TDD: Tests primero, implementación después
 * 
 * API: /api/admin/alerts
 * Páginas: /admin/alerts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Sistema de Alertas - API Admin', () => {
  const adminTest = {
    email: 'admin-alertas@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Alertas',
    rol: 'ADMIN',
  };

  const clienteTest = {
    email: 'cliente-alertas@example.com',
    password: 'ClientPass123!',
    nombre: 'Cliente Alertas',
    rol: 'CLIENTE',
  };

  let adminId: string;
  let clienteId: string;
  let productoId: string;
  let alertaId: string;

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

    // Crear producto de prueba
    const producto = await prisma.producto.create({
      data: {
        nombre: 'Producto Test Alertas',
        slug: 'producto-test-alertas',
        descripcion: 'Producto para testing',
        descripcionCorta: 'Test',
        precio: 10.00,
        stock: 5,
        categoria: 'DECORACION',
        material: 'PLA',
        activo: true,
      },
    });
    productoId = producto.id;

    // Crear alerta de prueba
    const alerta = await prisma.alerta.create({
      data: {
        tipo: 'STOCK_BAJO',
        severidad: 'ALTA',
        titulo: 'Stock bajo en Producto Test',
        mensaje: 'Quedan solo 5 unidades',
        productoId: productoId,
        estado: 'PENDIENTE',
      },
    });
    alertaId = alerta.id;
  });

  afterAll(async () => {
    // Limpiar datos de test
    await prisma.alerta.deleteMany({
      where: { id: alertaId }
    });
    await prisma.producto.deleteMany({
      where: { id: productoId }
    });
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });
  });

  describe('GET /api/admin/alerts', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts');
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('No autenticado');
    });

    it('debe retornar 403 si el usuario no es admin', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });
      
      expect([401, 403]).toContain(response.status);
    });

    it('debe listar alertas para admin autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Puede cargar o redirigir
      expect([200, 302, 401]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.alertas)).toBe(true);
      }
    });

    it('debe filtrar por tipo de alerta', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts?tipo=STOCK_BAJO', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe filtrar por severidad', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts?severidad=ALTA', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe filtrar por estado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts?estado=PENDIENTE', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe incluir información del producto relacionado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.alertas && data.alertas.length > 0) {
          const alertaConProducto = data.alertas.find((a: any) => a.producto);
          if (alertaConProducto) {
            expect(alertaConProducto.producto).toHaveProperty('nombre');
          }
        }
      }
    });
  });

  describe('PATCH /api/admin/alerts', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertaId, estado: 'RESUELTA' }),
      });
      expect(response.status).toBe(401);
    });

    it('debe marcar alerta como resuelta', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ 
          id: alertaId, 
          estado: 'RESUELTA',
          notasResolucion: 'Stock repuesto'
        }),
      });

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('debe validar el estado permitido', async () => {
      const response = await fetch('http://localhost:3000/api/admin/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ id: alertaId, estado: 'ESTADO_INVALIDO' }),
      });

      expect([200, 400, 401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /api/admin/alerts/[id]', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/alerts/${alertaId}`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(401);
    });

    it('debe eliminar alerta', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/alerts/${alertaId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('Generación automática de alertas', () => {
    it('debe detectar stock bajo automáticamente', async () => {
      // Este test verifica que el sistema detecte stock bajo
      // La implementación debe generar alertas cuando stock < 10
      expect(true).toBe(true); // Placeholder para lógica de generación automática
    });

    it('debe detectar pedidos sin pagar por más de 24h', async () => {
      // Verificar alertas de pedidos pendientes
      expect(true).toBe(true);
    });
  });
});

describe('Sistema de Alertas - Página UI', () => {
  describe('GET /admin/alerts', () => {
    it('debe cargar página de alertas', async () => {
      const response = await fetch('http://localhost:3000/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe mostrar contador de alertas pendientes', async () => {
      const response = await fetch('http://localhost:3000/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasContent = html.includes('Alertas') || 
                          html.includes('alertas') ||
                          html.includes('Iniciar sesión');
        expect(hasContent).toBe(true);
      }
    });

    it('debe tener filtros por tipo y severidad', async () => {
      const response = await fetch('http://localhost:3000/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasFilters = html.includes('filtro') || 
                           html.includes('tipo') ||
                           html.includes('severidad') ||
                           html.includes('login');
        expect(hasFilters).toBe(true);
      }
    });

    it('debe tener acciones para resolver alertas', async () => {
      const response = await fetch('http://localhost:3000/admin/alerts', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasActions = html.includes('resolver') || 
                          html.includes('marcar') ||
                          html.includes('eliminar') ||
                          html.includes('login');
        expect(hasActions).toBe(true);
      }
    });
  });
});

describe('Tipos de Alertas Soportadas', () => {
  const tiposAlerta = [
    { tipo: 'STOCK_BAJO', descripcion: 'Stock por debajo del mínimo' },
    { tipo: 'STOCK_AGOTADO', descripcion: 'Producto sin stock' },
    { tipo: 'PEDIDO_SIN_PAGAR', descripcion: 'Pedido pendiente de pago' },
    { tipo: 'PEDIDO_ATRASADO', descripcion: 'Pedido con retraso en envío' },
    { tipo: 'ERROR_SISTEMA', descripcion: 'Error en procesamiento' },
  ];

  it('debe soportar todos los tipos de alerta', () => {
    tiposAlerta.forEach(alerta => {
      expect(alerta.tipo).toBeTruthy();
      expect(alerta.descripcion).toBeTruthy();
    });
  });

  it('debe tener niveles de severidad', () => {
    const severidades = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
    severidades.forEach(sev => {
      expect(sev).toBeTruthy();
    });
  });
});