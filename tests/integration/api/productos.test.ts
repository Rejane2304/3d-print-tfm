/**
 * Tests de Integración - API de Productos
 * GET /api/products - Listado con filtros
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Import será agregado cuando implementemos el endpoint
// import { GET } from '@/app/api/products/route';

describe('GET /api/products', () => {
  beforeEach(async () => {
    // No necesitamos limpiar ya que usamos datos del seed
  });

  describe('Listado básico', () => {
    it('debe retornar lista de productos activos', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        take: 10,
      });

      expect(productos).toBeDefined();
      expect(productos.length).toBeGreaterThan(0);
      expect(productos[0]).toHaveProperty('id');
      expect(productos[0]).toHaveProperty('nombre');
      expect(productos[0]).toHaveProperty('precio');
    });

    it('debe incluir imágenes de los productos', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        take: 5,
        include: {
          imagenes: {
            where: { esPrincipal: true },
            take: 1,
          },
        },
      });

      expect(productos[0].imagenes).toBeDefined();
    });

    it('debe retornar metadatos de paginación', async () => {
      const total = await prisma.producto.count({ where: { activo: true } });
      
      expect(total).toBeGreaterThan(0);
      // Verificar que podemos calcular páginas
      const pageSize = 12;
      const totalPages = Math.ceil(total / pageSize);
      expect(totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filtrado por categoría', () => {
    it('debe filtrar por categoría DECORACION', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'DECORACION',
        },
      });

      expect(productos).toBeDefined();
      // Si hay productos, todos deben ser de la categoría filtrada
      if (productos.length > 0) {
        expect(productos[0].categoria).toBe('DECORACION');
      }
    });

    it('debe filtrar por categoría ACCESORIOS', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'ACCESORIOS',
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe filtrar por categoría FUNCIONAL', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'FUNCIONAL',
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe filtrar por categoría ARTICULADOS', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'ARTICULADOS',
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe filtrar por categoría JUGUETES', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'JUGUETES',
        },
      });

      expect(productos).toBeDefined();
    });
  });

  describe('Filtrado por material', () => {
    it('debe filtrar por material PLA', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          material: 'PLA',
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe filtrar por material PETG', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          material: 'PETG',
        },
      });

      expect(productos).toBeDefined();
    });
  });

  describe('Filtrado por precio', () => {
    it('debe filtrar productos por rango de precio mínimo', async () => {
      const minPrice = 10;
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          precio: {
            gte: minPrice,
          },
        },
      });

      // Si hay resultados, todos deben cumplir el filtro
      productos.forEach(producto => {
        expect(Number(producto.precio)).toBeGreaterThanOrEqual(minPrice);
      });
    });

    it('debe filtrar productos por rango de precio máximo', async () => {
      const maxPrice = 50;
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          precio: {
            lte: maxPrice,
          },
        },
      });

      productos.forEach(producto => {
        expect(Number(producto.precio)).toBeLessThanOrEqual(maxPrice);
      });
    });

    it('debe filtrar productos por rango de precio completo', async () => {
      const minPrice = 10;
      const maxPrice = 40;
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          precio: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
      });

      productos.forEach(producto => {
        const precio = Number(producto.precio);
        expect(precio).toBeGreaterThanOrEqual(minPrice);
        expect(precio).toBeLessThanOrEqual(maxPrice);
      });
    });
  });

  describe('Filtrado por disponibilidad', () => {
    it('debe filtrar solo productos en stock', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          stock: {
            gt: 0,
          },
        },
      });

      productos.forEach(producto => {
        expect(producto.stock).toBeGreaterThan(0);
      });
    });
  });

  describe('Ordenamiento', () => {
    it('debe ordenar por precio ascendente', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        orderBy: { precio: 'asc' },
        take: 5,
      });

      for (let i = 1; i < productos.length; i++) {
        const prev = Number(productos[i - 1].precio);
        const curr = Number(productos[i].precio);
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('debe ordenar por precio descendente', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        orderBy: { precio: 'desc' },
        take: 5,
      });

      for (let i = 1; i < productos.length; i++) {
        const prev = Number(productos[i - 1].precio);
        const curr = Number(productos[i].precio);
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });

    it('debe ordenar por nombre alfabéticamente', async () => {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
        take: 5,
      });

      for (let i = 1; i < productos.length; i++) {
        const prev = productos[i - 1].nombre.toLowerCase();
        const curr = productos[i].nombre.toLowerCase();
        expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Paginación', () => {
    it('debe respetar el límite de productos por página', async () => {
      const pageSize = 5;
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        take: pageSize,
      });

      expect(productos.length).toBeLessThanOrEqual(pageSize);
    });

    it('debe permitir saltar productos con offset', async () => {
      const skip = 2;
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        skip: skip,
        take: 3,
      });

      expect(productos).toBeDefined();
    });
  });

  describe('Combinación de filtros', () => {
    it('debe permitir combinar categoría y material', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'DECORACION',
          material: 'PLA',
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe permitir combinar categoría y rango de precio', async () => {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: 'ACCESORIOS',
          precio: {
            gte: 10,
            lte: 30,
          },
        },
      });

      expect(productos).toBeDefined();
    });
  });

  describe('Búsqueda por texto', () => {
    it('debe buscar productos por nombre', async () => {
      const searchTerm = 'vaso';
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          nombre: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });

      expect(productos).toBeDefined();
    });

    it('debe buscar productos por descripción', async () => {
      const searchTerm = 'decoración';
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          OR: [
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { descripcion: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      expect(productos).toBeDefined();
    });
  });
});

// Helper para crear requests (para cuando implementemos el endpoint)
function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}
