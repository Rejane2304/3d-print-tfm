/**
 * Integration Tests - Cart API
 * Testing real database and API endpoints
 * 
 * Endpoints:
 * - GET /api/cart - get current cart
 * - POST /api/cart - add item
 * - PATCH /api/cart/[itemId] - update quantity
 * - DELETE /api/cart/[itemId] - remove item
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCart, POST as addToCart } from '@/app/api/cart/route';
import { PATCH as updateCartItem, DELETE as deleteCartItem } from '@/app/api/cart/[itemId]/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Cart API', () => {
  let customerUser: { id: string; email: string; name: string };
  let testProduct: { id: string; name: string; slug: string; stock: number; price: number };
  let testCategory: { id: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.cartItem.deleteMany({
      where: { cart: { user: { email: { startsWith: 'cart-test-' } } } },
    });
    await prisma.cart.deleteMany({
      where: { user: { email: { startsWith: 'cart-test-' } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'cart-test-' } } },
    );
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'cart-test-' } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'cart-test-' } } },
    );

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    customerUser = await prisma.user.create({
      data: {
        email: `cart-test-${Date.now()}@test.com`,
        password: hashedPassword,
        name: 'Cart Test User',
        role: 'CUSTOMER',
        isActive: true,
      },
    });

    // Create test category and product
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `cart-test-category-${Date.now()}`,
        isActive: true,
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: `cart-test-product-${Date.now()}`,
        description: 'Test product for cart',
        price: 29.99,
        stock: 10,
        categoryId: testCategory.id,
        material: 'PLA',
        isActive: true,
      },
    }) as unknown as { id: string; name: string; slug: string; stock: number; price: number };

    // Reset mocks
    vi.mocked(getServerSession).mockReset();
  });

  afterEach(async () => {
    // Clean up
    await prisma.cartItem.deleteMany({
      where: { cart: { user: { email: { startsWith: 'cart-test-' } } } },
    });
    await prisma.cart.deleteMany({
      where: { user: { email: { startsWith: 'cart-test-' } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'cart-test-' } } },
    );
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'cart-test-' } } },
    );
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'cart-test-' } } },
    );
  });

  describe('GET /api/cart', () => {
    it('should return 401 without authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/cart');
      const res = await getCart(req);

      expect(res.status).toBe(401);
    });

    it('should return empty cart for new user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart');
      const res = await getCart(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.cart.items).toEqual([]);
      expect(body.cart.totalItems).toBe(0);
      expect(body.cart.subtotal).toBe(0);
    });

    it('should return cart with items', async () => {
      // Create cart with items
      const newCart = await prisma.cart.create({
        data: {
          userId: customerUser.id,
          subtotal: 59.98,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: newCart.id,
          productId: testProduct.id,
          quantity: 2,
          unitPrice: 29.99,
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart');
      const res = await getCart(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.cart.items.length).toBe(1);
      expect(body.cart.totalItems).toBe(2);
      expect(body.cart.subtotal).toBeCloseTo(59.98, 2);
    });
  });

  describe('POST /api/cart - Add Item', () => {
    it('should return 401 without authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
      });

      const res = await addToCart(req);
      expect(res.status).toBe(401);
    });

    it('should add product to cart', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
      });

      const res = await addToCart(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);

      // Verify cart in database
      const cart = await prisma.cart.findUnique({
        where: { userId: customerUser.id },
        include: { items: true },
      });

      expect(cart).toBeTruthy();
      expect(cart!.items.length).toBe(1);
      expect(cart!.items[0].quantity).toBe(2);
      expect(Number(cart!.subtotal)).toBeCloseTo(59.98, 2);
    });

    it('should reject quantity greater than stock', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 100 }),
      });

      const res = await addToCart(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('stock');
    });

    it('should reject quantity less than 1', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 0 }),
      });

      const res = await addToCart(req);
      expect(res.status).toBe(400);
    });

    it('should reject non-existent product', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'non-existent-id', quantity: 1 }),
      });

      const res = await addToCart(req);
      expect(res.status).toBe(404);
    });

    it('should reject inactive product', async () => {
      // Create inactive product
      const inactiveProduct = await prisma.product.create({
        data: {
          name: 'Inactive Product',
          slug: `cart-test-inactive-${Date.now()}`,
          description: 'Inactive product',
          price: 19.99,
          stock: 5,
          categoryId: testCategory.id,
          material: 'PLA',
          isActive: false,
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: inactiveProduct.id, quantity: 1 }),
      });

      const res = await addToCart(req);
      expect(res.status).toBe(400);
    });

    it('should update quantity when adding existing product', async () => {
      // First add
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      await addToCart(new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
      }));

      // Add same product again
      await addToCart(new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
      }));

      // Verify quantity is updated
      const cart = await prisma.cart.findUnique({
        where: { userId: customerUser.id },
        include: { items: true },
      });

      expect(cart!.items[0].quantity).toBe(3);
    });
  });

  describe('PATCH /api/cart/[itemId] - Update Quantity', () => {
    let cartItem: { id: string };

    beforeEach(async () => {
      // Create cart and item
      const newCart = await prisma.cart.create({
        data: {
          userId: customerUser.id,
          subtotal: 29.99,
        },
      });

      cartItem = await prisma.cartItem.create({
        data: {
          cartId: newCart.id,
          productId: testProduct.id,
          quantity: 1,
          unitPrice: 29.99,
        },
      });
    });

    it('should update item quantity', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/cart/${cartItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 3 }),
      });

      const res = await updateCartItem(req, { params: { itemId: cartItem.id } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify in database
      const updatedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      });
      expect(updatedItem!.quantity).toBe(3);
    });

    it('should remove item when quantity is 0', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/cart/${cartItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 0 }),
      });

      const res = await updateCartItem(req, { params: { itemId: cartItem.id } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toContain('eliminado');

      // Verify item is deleted
      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      });
      expect(deletedItem).toBeNull();
    });

    it('should reject quantity exceeding stock', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/cart/${cartItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 100 }),
      });

      const res = await updateCartItem(req, { params: { itemId: cartItem.id } });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/cart/[itemId] - Remove Item', () => {
    let cartItem: { id: string };

    beforeEach(async () => {
      // Create cart and item
      const newCart = await prisma.cart.create({
        data: {
          userId: customerUser.id,
          subtotal: 29.99,
        },
      });

      cartItem = await prisma.cartItem.create({
        data: {
          cartId: newCart.id,
          productId: testProduct.id,
          quantity: 1,
          unitPrice: 29.99,
        },
      });
    });

    it('should delete cart item', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest(`http://localhost:3000/api/cart/${cartItem.id}`, {
        method: 'DELETE',
      });

      const res = await deleteCartItem(req, { params: { itemId: cartItem.id } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify item is deleted
      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      });
      expect(deletedItem).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest(`http://localhost:3000/api/cart/${cartItem.id}`, {
        method: 'DELETE',
      });

      const res = await deleteCartItem(req, { params: { itemId: cartItem.id } });
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent item', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: customerUser.email, name: customerUser.name },
      });

      const req = new NextRequest('http://localhost:3000/api/cart/non-existent-id', {
        method: 'DELETE',
      });

      const res = await deleteCartItem(req, { params: { itemId: 'non-existent-id' } });
      expect(res.status).toBe(404);
    });
  });
});
