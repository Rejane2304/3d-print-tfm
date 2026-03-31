/**
 * Tests de Integración - Página de Inicio
 * Tests para la página principal y carga de productos destacados
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('Home Page - Productos Destacados', () => {
  beforeEach(async () => {
    // Limpiar productos de prueba
    await prisma.producto.deleteMany({
      where: {
        id: {
          in: ['TEST-PROD-001', 'TEST-PROD-002'],
        },
      },
    });
  });

  describe('Carga de productos', () => {
    it('debe cargar productos destacados de la base de datos', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        take: 4,
        include: {
          imagenes: {
            where: { esPrincipal: true },
            take: 1,
          },
        },
      });

      expect(productos).toBeDefined();
      expect(Array.isArray(productos)).toBe(true);
    });

    it('debe incluir imágenes principales de los productos', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        take: 4,
        include: {
          imagenes: {
            where: { esPrincipal: true },
            take: 1,
          },
        },
      });

      // Cada producto debe tener su array de imágenes
      productos.forEach(producto => {
        expect(producto.imagenes).toBeDefined();
        expect(Array.isArray(producto.imagenes)).toBe(true);
      });
    });

    it('debe retornar máximo 4 productos destacados', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        take: 4,
      });

      expect(productos.length).toBeLessThanOrEqual(4);
    });

    it('debe filtrar solo productos activos', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
      });

      productos.forEach(producto => {
        expect(producto.activo).toBe(true);
      });
    });
  });

  describe('Datos de productos', () => {
    it('debe incluir campos requeridos del producto', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        take: 1,
      });

      if (productos.length > 0) {
        const producto = productos[0];
        expect(producto.id).toBeDefined();
        expect(producto.nombre).toBeDefined();
        expect(producto.precio).toBeDefined();
        expect(producto.stock).toBeDefined();
        expect(producto.slug).toBeDefined();
      }
    });

    it('debe tener precio como número válido', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        take: 4,
      });

      productos.forEach(producto => {
        const precio = Number(producto.precio);
        expect(precio).toBeGreaterThan(0);
        expect(typeof precio).toBe('number');
      });
    });

    it('debe tener URLs de imágenes válidas', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          destacado: true,
        },
        include: {
          imagenes: {
            where: { esPrincipal: true },
            take: 1,
          },
        },
      });

      productos.forEach(producto => {
        if (producto.imagenes.length > 0) {
          const imagen = producto.imagenes[0];
          expect(imagen.url).toBeDefined();
          expect(imagen.url).toMatch(/^\//); // Debe empezar con /
          expect(imagen.url).toContain('/images/products/');
        }
      });
    });
  });

  describe('Estructura de URLs', () => {
    it('debe generar slugs correctos para productos', async () => {
      const productos = await prisma.producto.findMany({
        take: 4,
      });

      productos.forEach(producto => {
        expect(producto.slug).toBeDefined();
        // Slug debe ser URL-friendly (lowercase, con guiones)
        expect(producto.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });
    });
  });
});
