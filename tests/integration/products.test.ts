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
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('debe filtrar por categoría', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?category=DECORATION');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.data.length > 0) {
        expect(data.data[0].category).toBe('DECORATION');
      }
    });

    it('debe filtrar por material', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?material=PLA');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });

    it('debe buscar por query', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?search=vaso');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
    });

    it('debe ordenar por precio ascendente', async () => {
      const req = new NextRequest('http://localhost:3000/api/products?sortBy=price&order=asc');
      const res = await getProducts(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.data.length > 1) {
        const price1 = parseFloat(data.data[0].price);
        const price2 = parseFloat(data.data[1].price);
        expect(price1).toBeLessThanOrEqual(price2);
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
      productoTest = await prisma.product.findFirst({
        where: { isActive: true },
        include: { images: true },
      });
    });

    it('debe retornar detalle de producto por slug', async () => {
      if (!productoTest) return;

      const req = new NextRequest(`http://localhost:3000/api/products/${productoTest.slug}`);
      const res = await getProductDetail(req, { params: { slug: productoTest.slug } });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.producto).toBeDefined();
      expect(data.data.producto.slug).toBe(productoTest.slug);
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
      expect(data.data.producto.images).toBeDefined();
    });
  });

  describe('Gestión Admin de Productos', () => {
    it('debe crear producto con datos válidos', async () => {
      // Verificar que podemos crear productos vía API
      // Nota: Esto requiere autenticación de admin
      const slugUnico = `test-producto-${Date.now()}`;
      
      // Obtener o crear una categoría para el test
      let category = await prisma.category.findFirst({ where: { isActive: true } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Test Category',
            slug: `test-category-${Date.now()}`,
            isActive: true,
          },
        });
      }
      
      const producto = await prisma.product.create({
        data: {
          slug: slugUnico,
          name: 'Producto Test',
          description: 'Descripción test',
          price: 29.99,
          stock: 10,
          categoryId: category.id,
          material: 'PLA',
          isActive: true,
        },
      });

      expect(producto).toBeDefined();
      expect(producto.slug).toBe(slugUnico);

      // Limpieza
      await prisma.product.delete({ where: { id: producto.id } });
    });

    it('debe actualizar stock del producto', async () => {
      const producto = await prisma.product.findFirst({ where: { isActive: true } });
      if (!producto) return;

      const nuevoStock = producto.stock + 5;
      
      const actualizado = await prisma.product.update({
        where: { id: producto.id },
        data: { stock: nuevoStock },
      });

      expect(actualizado.stock).toBe(nuevoStock);

      // Restaurar stock original
      await prisma.product.update({
        where: { id: producto.id },
        data: { stock: producto.stock },
      });
    });

    it('debe activar/desactivar producto', async () => {
      const producto = await prisma.product.findFirst({ where: { isActive: true } });
      if (!producto) return;

      // Desactivar
      await prisma.product.update({
        where: { id: producto.id },
        data: { isActive: false },
      });

      const desactivado = await prisma.product.findUnique({
        where: { id: producto.id },
      });

      expect(desactivado!.isActive).toBe(false);

      // Reactivar
      await prisma.product.update({
        where: { id: producto.id },
        data: { isActive: true },
      });
    });
  });
});
