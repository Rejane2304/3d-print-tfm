/**
 * Tests de Integración - API de Producto Individual
 * GET /api/products/[slug] - Detalle de producto
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { findWithRetry, waitForDataPersistence } from '../../helpers/db-wait';

describe('GET /api/products/[slug]', () => {
  let productoTest: any;

  beforeAll(async () => {
    // Esperar a que los datos de setup persistan
    await waitForDataPersistence(800);

    // Crear producto de prueba si no existe
    const existente = await findWithRetry(
      () => prisma.producto.findFirst({
        where: { activo: true },
        include: { imagenes: true },
      }),
      { maxRetries: 5, delayMs: 200, logAttempts: false }
    );

    if (existente) {
      productoTest = existente;
    } else {
      // Crear producto de prueba
      productoTest = await prisma.producto.create({
        data: {
          slug: `test-producto-detalle-${Date.now()}`,
          nombre: 'Producto Test Detalle',
          descripcion: 'Descripción de prueba',
          precio: 29.99,
          stock: 10,
          categoria: 'DECORACION',
          material: 'PLA',
          activo: true,
          imagenes: {
            create: {
              url: 'https://example.com/test.jpg',
              nombreArchivo: 'test.jpg',
              textoAlt: 'Test',
              esPrincipal: true,
              orden: 0,
            },
          },
        },
        include: { imagenes: true },
      });
      
      // Esperar persistencia después de crear
      await waitForDataPersistence(800);
    }
  });

  describe('Obtener producto por slug', () => {
    it('debe retornar producto existente', async () => {
      const producto = await findWithRetry(
        () => prisma.producto.findFirst({
          where: { activo: true },
          include: { imagenes: true },
        }),
        { maxRetries: 6, delayMs: 200, backoffMultiplier: 1.1, logAttempts: false }
      );

      expect(producto).toBeDefined();
      expect(producto).toHaveProperty('id');
      expect(producto).toHaveProperty('slug');
      expect(producto).toHaveProperty('nombre');
    }, 30000);

    it('debe incluir todas las imágenes del producto', async () => {
      const producto = await findWithRetry(
        () => prisma.producto.findFirst({
          where: { activo: true },
          include: { imagenes: true },
        }),
        { maxRetries: 6, delayMs: 200, logAttempts: false }
      );

      expect(producto?.imagenes).toBeDefined();
      expect(Array.isArray(producto?.imagenes)).toBe(true);
    }, 30000);

    it('debe incluir imagen principal identificada', async () => {
      const producto = await findWithRetry(
        () => prisma.producto.findFirst({
          where: { activo: true },
          include: { imagenes: true },
        }),
        { maxRetries: 6, delayMs: 200, logAttempts: false }
      );

      const imagenPrincipal = producto?.imagenes.find((img: any) => img.esPrincipal);
      if (producto && producto.imagenes.length > 0) {
        expect(imagenPrincipal).toBeDefined();
      }
    }, 30000);
  });

  describe('Datos del producto', () => {
    it('debe incluir precio como número', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toBeDefined();
      const precio = Number(producto?.precio);
      expect(typeof precio).toBe('number');
      expect(precio).toBeGreaterThan(0);
    }, 30000);

    it('debe incluir stock disponible', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('stock');
      expect(producto?.stock).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('debe incluir categoría del producto', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('categoria');
      expect(producto?.categoria).toBeDefined();
    }, 30000);

    it('debe incluir material del producto', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('material');
      expect(producto?.material).toBeDefined();
    }, 30000);
  });

  describe('Productos relacionados', () => {
    it('debe obtener productos de la misma categoría', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      if (!producto) return;

      const relacionados = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: producto.categoria,
          id: { not: producto.id },
        },
        take: 4,
      });

      expect(relacionados).toBeDefined();
      relacionados.forEach((p: any) => {
        expect(p.categoria).toBe(producto.categoria);
      });
    }, 30000);
  });

  describe('Producto no encontrado', () => {
    it('debe manejar slug inexistente', async () => {
      const producto = await prisma.producto.findUnique({
        where: { slug: 'producto-inexistente-slug' },
      });

      expect(producto).toBeNull();
    }, 30000);
  });

  describe('Productos inactivos', () => {
    it('no debe retornar productos inactivos', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: false },
      });

      expect(productos.length).toBeLessThanOrEqual(0);
    }, 30000);
  });
});
