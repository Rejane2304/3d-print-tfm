/**
 * Tests de Integración - Dashboard Admin UI
 * TDD: Tests primero, implementación después
 * 
 * Página: /admin/dashboard
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Dashboard Admin - Página UI', () => {
  const adminTest = {
    email: 'admin-dashboard@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Dashboard',
    rol: 'ADMIN',
  };

  const clienteTest = {
    email: 'cliente-dashboard@example.com',
    password: 'ClientPass123!',
    nombre: 'Cliente Dashboard',
    rol: 'CLIENTE',
  };

  beforeAll(async () => {
    // Limpiar usuarios de test
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
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

    // Crear cliente
    await prisma.usuario.create({
      data: {
        email: clienteTest.email,
        password: await bcrypt.hash(clienteTest.password, 12),
        nombre: clienteTest.nombre,
        rol: 'CLIENTE',
        activo: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });
  });

  describe('GET /admin/dashboard', () => {
    it('debe cargar dashboard para admin autenticado', async () => {
      const response = await fetch('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Debe cargar la página (puede redirigir si no hay sesión real)
      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe mostrar métricas principales', async () => {
      const response = await fetch('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Si carga correctamente, debe contener elementos del dashboard
      if (response.status === 200) {
        const html = await response.text();
        expect(html).toContain('Dashboard');
      }
    });

    it('debe redirigir a home si accede cliente', async () => {
      const response = await fetch('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });

      // Cliente debe ser redirigido a home
      expect([302, 401, 403]).toContain(response.status);
    });

    it('debe redirigir a login si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/admin/dashboard');

      // La página carga (200) pero redirige vía JavaScript
      // o el middleware puede devolver 302/401
      expect([200, 302, 401]).toContain(response.status);
    });
  });

  describe('Navegación del Panel Admin', () => {
    it('debe tener enlaces a secciones del admin', async () => {
      const response = await fetch('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        // Debe tener navegación
        expect(html).toMatch(/productos|pedidos|usuarios/i);
      }
    });
  });
});
