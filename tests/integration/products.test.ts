import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getProductDetail } from '@/app/api/products/[slug]/route';

describe('API de Productos', () => {
  describe('GET /api/products - Listado', () => {
    it('debe retornar lista de productos activos', async () => {
      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.productos).toBeDefined();
      expect(data.productos.length).toBeGreaterThan(0);
    });

    it('debe filtrar por categoría', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?categoria=DECORACION');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.productos.length > 0) {
        expect(data.productos[0].categoria).toBe('DECORACION');
      }
    });

    it('debe filtrar por material', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?material=PLA');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.productos).toBeDefined();
    });

    it('debe buscar por query', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?q=vaso');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.productos).toBeDefined();
    });

    it('debe ordenar por precio ascendente', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?sort=precio_asc');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.productos.length > 1) {
        expect(data.productos[0].precio).toBeLessThanOrEqual(data.productos[1].precio);
      }
    });

    it('debe paginar resultados', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?page=1');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });
  });

  describe('GET /api/products/[slug] - Detalle', () => {
    let productoTest: any;

    beforeAll(async () => {
      // Obtener un producto existente para testing
      productoTest = await prisma.producto.findFirst({
        where: { activo: true },
        include: { imagenes: true },
      });
    });

    it('debe retornar detalle de producto por slug', async () => {
      if (!productoTest) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${productoTest.slug}`);
      const res = await getProductDetail(req, { params: { slug: productoTest.slug } });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.producto).toBeDefined();
      expect(data.producto.slug).toBe(productoTest.slug);
    });

    it('debe retornar 404 para producto inexistente', async () => {
      const req = new NextRequest('http://localhost:3000/api/products/producto-inexistente-12345');
      const res = await getProductDetail(req, { params: { slug: 'producto-inexistente-12345' } });
      
      expect(res.status).toBe(404);
    });

    it('debe incluir imágenes del producto', async () => {
      if (!productoTest) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${productoTest.slug}`);
      const res = await getProductDetail(req, { params: { slug: productoTest.slug } });
      
      const data = await res.json();
      expect(data.producto.imagenes).toBeDefined();
    });
  });

  describe('Gestión Admin de Productos', () => {
    it('debe crear producto con datos válidos', async () => {
      // Verificar que podemos crear productos vía API
      // Nota: Esto requiere autenticación de admin
      const slugUnico = `test-producto-${Date.now()}`;
      
      const producto = await prisma.producto.create({
        data: {
          slug: slugUnico,
          nombre: 'Producto Test',
          descripcion: 'Descripción test',
          precio: 29.99,
          stock: 10,
          categoria: 'DECORACION',
          material: 'PLA',
          activo: true,
        },
      });

      expect(producto).toBeDefined();
      expect(producto.slug).toBe(slugUnico);

      // Limpieza
      await prisma.producto.delete({ where: { id: producto.id } });
    });

    it('debe actualizar stock del producto', async () => {
      const producto = await prisma.producto.findFirst({ where: { activo: true } });
      if (!producto) return;

      const nuevoStock = producto.stock + 5;
      
      const actualizado = await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: nuevoStock },
      });

      expect(actualizado.stock).toBe(nuevoStock);

      // Restaurar stock original
      await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: producto.stock },
      });
    });

    it('debe activar/desactivar producto', async () => {
      const producto = await prisma.producto.findFirst({ where: { activo: true } });
      if (!producto) return;

      // Desactivar
      await prisma.producto.update({
        where: { id: producto.id },
        data: { activo: false },
      });

      const desactivado = await prisma.producto.findUnique({
        where: { id: producto.id },
      });

      expect(desactivado!.activo).toBe(false);

      // Reactivar
      await prisma.producto.update({
        where: { id: producto.id },
        data: { activo: true },
      });
    });
  });
});
