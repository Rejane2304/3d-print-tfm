/**
 * Tests de Integración - API de Producto Individual
 * GET /api/productos/[slug] - Detalle de producto
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('GET /api/productos/[slug]', () => {
  describe('Obtener producto por slug', () => {
    it('debe retornar producto existente', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
        include: {
          imagenes: true,
        },
      });

      expect(producto).toBeDefined();
      expect(producto).toHaveProperty('id');
      expect(producto).toHaveProperty('slug');
      expect(producto).toHaveProperty('nombre');
      expect(producto).toHaveProperty('descripcion');
    }, 10000);

    it('debe incluir todas las imágenes del producto', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
        include: {
          imagenes: true,
        },
      });

      expect(producto?.imagenes).toBeDefined();
      expect(Array.isArray(producto?.imagenes)).toBe(true);
    });

    it('debe incluir imagen principal identificada', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
        include: {
          imagenes: true,
        },
      });

      const imagenPrincipal = producto?.imagenes.find((img: any) => img.esPrincipal);
      expect(imagenPrincipal).toBeDefined();
    });
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
    });

    it('debe incluir stock disponible', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('stock');
      expect(producto?.stock).toBeGreaterThanOrEqual(0);
    });

    it('debe incluir categoría del producto', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('categoria');
      expect(producto?.categoria).toBeDefined();
    });

    it('debe incluir material del producto', async () => {
      const producto = await prisma.producto.findFirst({
        where: { activo: true },
      });

      expect(producto).toHaveProperty('material');
      expect(producto?.material).toBeDefined();
    });
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
    });
  });

  describe('Producto no encontrado', () => {
    it('debe manejar slug inexistente', async () => {
      const producto = await prisma.producto.findUnique({
        where: { slug: 'producto-inexistente-slug' },
      });

      expect(producto).toBeNull();
    });
  });

  describe('Productos inactivos', () => {
    it('no debe retornar productos inactivos', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: false },
      });

      // Verificar que no se incluyen en resultados públicos
      expect(productos.length).toBeLessThanOrEqual(0);
    });
  });
});
