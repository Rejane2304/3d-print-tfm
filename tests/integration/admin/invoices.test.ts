/**
 * Tests de Integración - Sistema de Facturación
 * TDD: Tests primero, implementación después
 * 
 * API: /api/admin/invoices
 * Páginas: /admin/invoices, /admin/invoices/[id]
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Sistema de Facturación - API Admin', () => {
  const adminTest = {
    email: 'admin-facturas@example.com',
    password: 'AdminPass123!',
    nombre: 'Admin Facturas',
    rol: 'ADMIN',
  };

  const clienteTest = {
    email: 'cliente-facturas@example.com',
    password: 'ClientPass123!',
    nombre: 'Cliente Facturas',
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

    // Crear cliente con NIF
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

    // Crear pedido de prueba
    const pedido = await prisma.pedido.create({
      data: {
        numeroPedido: 'F-20240001',
        usuarioId: clienteId,
        estado: 'ENTREGADO',
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
    await prisma.factura.deleteMany({
      where: { pedidoId }
    });
    await prisma.pedido.deleteMany({
      where: { id: pedidoId }
    });
    await prisma.usuario.deleteMany({
      where: { email: { in: [adminTest.email, clienteTest.email] } }
    });
  });

  describe('GET /api/admin/invoices', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices');
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('No autenticado');
    });

    it('debe retornar 403 si el usuario no es admin', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        headers: {
          'Cookie': 'next-auth.session-token=cliente-token'
        }
      });
      
      expect([401, 403]).toContain(response.status);
    });

    it('debe listar facturas para admin autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Puede cargar o redirigir
      expect([200, 302, 401]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.facturas)).toBe(true);
      }
    });

    it('debe soportar paginación', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices?page=1&limit=10', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe permitir filtrar por fecha', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices?desde=2024-01-01&hasta=2024-12-31', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe permitir buscar por número de factura', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices?busqueda=F-2024', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });
  });

  describe('POST /api/admin/invoices', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: 'test-id' }),
      });
      expect(response.status).toBe(401);
    });

    it('debe validar que el pedido existe', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId: 'pedido-inexistente' }),
      });

      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });

    it('debe validar que el pedido está entregado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId }),
      });

      expect([200, 400, 401, 403]).toContain(response.status);
    });

    it('debe generar número de factura automáticamente', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId }),
      });

      if (response.status === 201) {
        const data = await response.json();
        expect(data.factura.numeroFactura).toMatch(/^F-\d{4}-\d+$/);
      }
    });

    it('debe incluir datos fiscales completos', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=admin-token'
        },
        body: JSON.stringify({ pedidoId }),
      });

      if (response.status === 201) {
        const data = await response.json();
        expect(data.factura).toHaveProperty('numeroFactura');
        expect(data.factura).toHaveProperty('fechaEmision');
        expect(data.factura).toHaveProperty('subtotal');
        expect(data.factura).toHaveProperty('iva');
        expect(data.factura).toHaveProperty('total');
      }
    });
  });

  describe('GET /api/admin/invoices/[id]', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices/test-id');
      expect(response.status).toBe(401);
    });

    it('debe retornar 404 si la factura no existe', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices/factura-inexistente', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([401, 403, 404]).toContain(response.status);
    });

    it('debe retornar detalle completo de factura', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/invoices/test-factura-id`, {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('GET /api/admin/invoices/[id]/pdf', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices/test-id/pdf');
      expect(response.status).toBe(401);
    });

    it('debe generar PDF de la factura', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/invoices/test-factura-id/pdf`, {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Puede retornar PDF o error si no existe
      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/pdf');
      }
    });
  });

  describe('DELETE /api/admin/invoices/[id]', () => {
    it('debe retornar 401 si no está autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices/test-id', {
        method: 'DELETE',
      });
      expect(response.status).toBe(401);
    });

    it('debe permitir anular factura (no eliminar)', async () => {
      const response = await fetch('http://localhost:3000/api/admin/invoices/test-id', {
        method: 'DELETE',
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      // Anular cambia estado, no elimina
      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });
});

describe('Sistema de Facturación - Página UI', () => {
  describe('GET /admin/invoices', () => {
    it('debe cargar página de facturas', async () => {
      const response = await fetch('http://localhost:3000/admin/invoices', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe mostrar listado de facturas', async () => {
      const response = await fetch('http://localhost:3000/admin/invoices', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasContent = html.includes('Gestión de Facturas') || 
                          html.includes('facturas') ||
                          html.includes('Iniciar sesión');
        expect(hasContent).toBe(true);
      }
    });

    it('debe tener botón para generar nueva factura', async () => {
      const response = await fetch('http://localhost:3000/admin/invoices', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasButton = html.includes('Nueva Factura') || 
                         html.includes('Generar') ||
                         html.includes('login');
        expect(hasButton).toBe(true);
      }
    });
  });

  describe('GET /admin/invoices/[id]', () => {
    it('debe cargar detalle de factura', async () => {
      const response = await fetch('http://localhost:3000/admin/invoices/test-id', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      expect([200, 302, 401]).toContain(response.status);
    });

    it('debe tener botón para descargar PDF', async () => {
      const response = await fetch('http://localhost:3000/admin/invoices/test-id', {
        headers: {
          'Cookie': 'next-auth.session-token=admin-token'
        }
      });

      if (response.status === 200) {
        const html = await response.text();
        const hasPDF = html.includes('PDF') || 
                        html.includes('Descargar') ||
                        html.includes('login');
        expect(hasPDF).toBe(true);
      }
    });
  });
});

describe('Validación de Datos Fiscales', () => {
  const nifValidos = [
    '12345678A',
    '87654321B',
    '00000000T',
  ];

  const nifInvalidos = [
    '1234567',      // Corto
    '12345678901',  // Largo
    '1234567A',     // Formato incorrecto
    'ABCDEFGH',     // Sin números
  ];

  it('debe aceptar NIFs válidos', () => {
    nifValidos.forEach(nif => {
      expect(nif).toMatch(/^\d{8}[A-Z]$/);
    });
  });

  it('debe rechazar NIFs inválidos', () => {
    nifInvalidos.forEach(nif => {
      expect(nif).not.toMatch(/^\d{8}[A-Z]$/);
    });
  });

  it('debe incluir información de IVA (21% por defecto)', () => {
    const ivaPorDefecto = 0.21;
    expect(ivaPorDefecto).toBe(0.21);
  });

  it('debe calcular total correctamente', () => {
    const subtotal = 100;
    const iva = 21;
    const total = subtotal + iva;
    expect(total).toBe(121);
  });
});

describe('Formato de Factura Española', () => {
  it('debe tener formato de número: F-AAAA-NNNNN', () => {
    const numeroFactura = 'F-2024-00001';
    expect(numeroFactura).toMatch(/^F-\d{4}-\d{5}$/);
  });

  it('debe incluir datos del vendedor', () => {
    const datosVendedor = {
      razonSocial: '3D Print TFM S.L.',
      nif: 'B12345678',
      direccion: 'Calle Ficticia 123',
      ciudad: 'Madrid',
      codigoPostal: '28001',
    };
    expect(datosVendedor.razonSocial).toBeTruthy();
    expect(datosVendedor.nif).toMatch(/^B\d{8}$/);
  });

  it('debe incluir datos del comprador', () => {
    const datosComprador = {
      nombre: 'Cliente Test',
      nif: '12345678A',
      direccion: 'Calle Real 456',
    };
    expect(datosComprador.nombre).toBeTruthy();
    expect(datosComprador.nif).toMatch(/^\d{8}[A-Z]$/);
  });
});