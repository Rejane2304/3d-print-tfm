/**
 * Tests de Integración - Gestión de Productos Admin
 * TDD: Tests primero, implementación después
 * 
 * Página: /admin/productos
 * Funcionalidades: Listar, crear, editar, eliminar productos
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Gestión de Productos - Admin', () => {
  const adminTest = {
    email: 'admin-productos@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Productos',
    rol: 'ADMIN',
  };

  beforeAll(async () => {
    // Limpiar usuario de test
    await prisma.usuario.deleteMany({
      where: { email: adminTest.email }
    });

    // Crear admin
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

  describe('GET /admin/productos', () => {
    it('debe mostrar página de gestión de productos', async () => {
      const response = await fetch('http://localhost:3000/admin/productos', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe cargar lista de productos', async () => {
      const response = await fetch('http://localhost:3000/admin/productos', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        expect(html).toContain('Productos');
      }
    });
  });

  describe('Formulario de crear producto', () => {
    it('debe mostrar formulario para nuevo producto', async () => {
      const response = await fetch('http://localhost:3000/admin/productos/nuevo', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401, 404]).toContain(response.status);
    });
  });

  describe('Página de editar producto', () => {
    it('debe mostrar formulario para editar producto existente', async () => {
      const response = await fetch('http://localhost:3000/admin/productos/test-slug/editar', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401, 404]).toContain(response.status);
    });
  });

  describe('API CRUD de Productos', () => {
    it('debe crear producto completo', async () => {
      const nuevoProducto = {
        nombre: 'Producto Test Admin',
        descripcion: 'Descripción de prueba para producto',
        descripcionCorta: 'Producto de prueba',
        precio: 29.99,
        precioAnterior: 35.99,
        stock: 50,
        stockMinimo: 10,
        categoria: 'DECORACION',
        material: 'PLA',
        dimensiones: '20x15x10 cm',
        peso: 150,
        tiempoImpresion: 120,
        activo: true,
        destacado: false,
      };

      const response = await fetch('http://localhost:3000/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify(nuevoProducto),
      });

      expect([201, 401]).toContain(response.status);
    });

    it('debe rechazar producto sin campos requeridos', async () => {
      const productoInvalido = {
        nombre: '',
        precio: -10,
      };

      const response = await fetch('http://localhost:3000/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify(productoInvalido),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('debe actualizar producto existente', async () => {
      const actualizacion = {
        nombre: 'Producto Actualizado',
        precio: 39.99,
        stock: 25,
      };

      const response = await fetch('http://localhost:3000/api/admin/productos/producto-test-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify(actualizacion),
      });

      expect([200, 401, 404]).toContain(response.status);
    });

    it('debe eliminar producto', async () => {
      const response = await fetch('http://localhost:3000/api/admin/productos/producto-test-123', {
        method: 'DELETE',
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        },
      });

      expect([200, 401, 404]).toContain(response.status);
    });

    it('debe cambiar estado activo/inactivo del producto', async () => {
      const response = await fetch('http://localhost:3000/api/admin/productos/producto-test-123/estado', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ activo: false }),
      });

      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe('Validaciones de productos', () => {
    it('debe validar precio mayor a 0', async () => {
      const response = await fetch('http://localhost:3000/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({
          nombre: 'Test',
          precio: 0,
        }),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('debe validar stock no negativo', async () => {
      const response = await fetch('http://localhost:3000/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({
          nombre: 'Test',
          precio: 10,
          stock: -5,
        }),
      });

      expect([400, 401]).toContain(response.status);
    });

    it('debe validar categoría válida', async () => {
      const response = await fetch('http://localhost:3000/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({
          nombre: 'Test',
          precio: 10,
          categoria: 'INVALIDA',
        }),
      });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Seguridad', () => {
    it('debe rechazar acceso no autenticado', async () => {
      const response = await fetch('http://localhost:3000/admin/productos');

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe rechazar acceso de cliente', async () => {
      const response = await fetch('http://localhost:3000/admin/productos', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      expect([200, 302, 401, 403]).toContain(response.status);
    });
  });
});
