/**
 * Integration Test Helpers
 * 
 * Shared utilities for integration tests using real database
 */

import { prisma } from '../helpers';
import bcrypt from 'bcrypt';
import { Material, OrderStatus } from '@/types/prisma-enums';
import { randomUUID } from 'node:crypto';
import { Decimal } from '@prisma/client/runtime/library';

// Test data interfaces
export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  token?: string;
}

export interface TestProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  material: Material;
  isActive: boolean;
}

export interface TestCart {
  id: string;
  userId: string;
}

export interface TestCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface TestAddress {
  id: string;
  userId: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Store created test data for cleanup
const testData: {
  users: string[];
  products: string[];
  categories: string[];
  carts: string[];
  cartItems: string[];
  addresses: string[];
  orders: string[];
  invoices: string[];
} = {
  users: [],
  products: [],
  categories: [],
  carts: [],
  cartItems: [],
  addresses: [],
  orders: [],
  invoices: [],
};

/**
 * Generate unique email for tests
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@test.com`;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(options: {
  role: 'ADMIN' | 'CUSTOMER';
  isActive?: boolean;
  email?: string;
}): Promise<TestUser> {
  const { role, isActive = true, email = generateTestEmail(role.toLowerCase()) } = options;
  const password = 'TestPassword123!'; // NOSONAR - Test password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      password: hashedPassword,
      name: `Test ${role}`,
      role,
      isActive,
      updatedAt: new Date(),
    },
  });

  testData.users.push(user.id);
  return {
    id: user.id,
    email: user.email,
    password,
    name: user.name,
    role,
  };
}

/**
 * Create a test category
 */
export async function createTestCategory(name?: string): Promise<{ id: string; name: string; slug: string }> {
  const categoryName = name || `Test Category ${Date.now()}`;
  const slug = categoryName.toLowerCase().replaceAll(' ', '-').replace(/[^a-z0-9-]/g, '');

  const category = await prisma.category.create({
    data: {
      id: randomUUID(),
      name: categoryName,
      slug: `${slug}-${Date.now()}`,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  testData.categories.push(category.id);
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

/**
 * Create a test product
 */
export async function createTestProduct(categoryId: string, options?: Partial<TestProduct>): Promise<TestProduct> {
  const timestamp = Date.now();
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      name: options?.name || `Test Product ${timestamp}`,
      slug: options?.slug || `test-product-${timestamp}`,
      description: options?.description || 'Test product description',
      price: options?.price || 29.99,
      stock: options?.stock ?? 10,
      categoryId,
      material: options?.material || 'PLA',
      isActive: options?.isActive ?? true,
      updatedAt: new Date(),
    },
  });

  testData.products.push(product.id);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    stock: product.stock,
    categoryId: product.categoryId,
    material: product.material,
    isActive: product.isActive,
  };
}

/**
 * Create a test cart for a user
 */
export async function createTestCart(userId: string): Promise<TestCart> {
  const cart = await prisma.cart.create({
    data: {
      id: randomUUID(),
      userId,
      subtotal: 0,
      updatedAt: new Date(),
    },
  });

  testData.carts.push(cart.id);
  return {
    id: cart.id,
    userId: cart.userId,
  };
}

/**
 * Add an item to a cart
 */
export async function addCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<TestCartItem> {
  const item = await prisma.cartItem.create({
    data: {
      id: randomUUID(),
      cartId,
      productId,
      quantity,
      unitPrice,
      updatedAt: new Date(),
    },
  });

  testData.cartItems.push(item.id);

  // Update cart subtotal
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  });

  if (cart) {
    const newSubtotal = cart.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0
    );
    await prisma.cart.update({
      where: { id: cartId },
      data: { subtotal: newSubtotal },
    });
  }

  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
  };
}

/**
 * Create a test address for a user
 */
export async function createTestAddress(userId: string, options?: Partial<TestAddress>): Promise<TestAddress> {
  const address = await prisma.address.create({
    data: {
      id: randomUUID(),
      userId,
      name: options?.name || 'Principal',
      recipient: options?.recipient || 'Test Recipient',
      phone: options?.phone || '+34 600 123 456',
      address: options?.address || 'Calle Test 123',
      city: options?.city || 'Madrid',
      province: options?.province || 'Madrid',
      postalCode: options?.postalCode || '28001',
      country: options?.country || 'Spain',
      isDefault: options?.isDefault ?? true,
      updatedAt: new Date(),
    },
  });

  testData.addresses.push(address.id);
  return {
    id: address.id,
    userId: address.userId,
    name: address.name,
    recipient: address.recipient,
    phone: address.phone,
    address: address.address,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  };
}

/**
 * Create a test order
 */
export async function createTestOrder(userId: string, options?: {
  status?: OrderStatus;
  total?: number;
  shippingAddressId?: string;
}): Promise<{ id: string; orderNumber: string; status: OrderStatus; total: number }> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const orderNumber = `P-${year}${String(count + 1).padStart(6, '0')}`;

  // Create address if not provided
  let addressId = options?.shippingAddressId;
  if (!addressId) {
    const address = await createTestAddress(userId);
    addressId = address.id;
  }

  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      orderNumber,
      userId,
      status: options?.status ?? OrderStatus.PENDING,
      subtotal: options?.total ?? 29.99,
      shipping: 5.99,
      total: options?.total ?? 35.98,
      shippingAddressId: addressId,
      shippingName: 'Test User',
      shippingPhone: '+34 600 123 456',
      shippingAddress: 'Calle Test 123',
      shippingPostalCode: '28001',
      shippingCity: 'Madrid',
      shippingProvince: 'Madrid',
      shippingCountry: 'Spain',
      updatedAt: new Date(),
    },
  });

  testData.orders.push(order.id);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
  };
}

/**
 * Create a test invoice
 */
export async function createTestInvoice(orderId: string): Promise<{ id: string; invoiceNumber: string }> {
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.invoice.findFirst({
    where: { series: 'F' },
    orderBy: { number: 'desc' },
  });
  const number = lastInvoice ? lastInvoice.number + 1 : 1;
  const invoiceNumber = `F-${year}-${String(number).padStart(6, '0')}`;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shipping);
  const vatRate = 21;
  // IVA solo sobre productos (no envío)
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal * (1 + vatRate / 100) + shipping;

  const invoice = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      invoiceNumber,
      series: 'F',
      number,
      orderId,
      companyName: '3D Print',
      companyTaxId: 'B12345678',
      companyAddress: 'Calle Impresión 3D, 123',
      companyCity: 'Barcelona',
      companyProvince: 'Barcelona',
      companyPostalCode: '08001',
      clientName: order.shippingName,
      clientTaxId: order.user?.taxId || '',
      clientAddress: order.shippingAddress,
      clientCity: order.shippingCity,
      clientProvince: order.shippingProvince,
      clientPostalCode: order.shippingPostalCode,
      clientCountry: order.shippingCountry,
      subtotal: order.subtotal,
      shipping: order.shipping,
      vatRate: new Decimal(vatRate),
      vatAmount: new Decimal(vatAmount),
      total: new Decimal(total),
    },
  });

  testData.invoices.push(invoice.id);
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  };
}

/**
 * Create authenticated request headers
 * Note: In real tests, we use NextRequest with direct route handler imports
 */
export function createAuthHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (userId) {
    // For integration tests, we mock the session in the request
    headers['x-test-user-id'] = userId;
  }
  
  return headers;
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(): Promise<void> {
  // Delete in reverse order of dependencies
  for (const id of testData.invoices) {
    try { await prisma.invoice.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.orders) {
    try { await prisma.order.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.cartItems) {
    try { await prisma.cartItem.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.carts) {
    try { await prisma.cart.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.addresses) {
    try { await prisma.address.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.products) {
    try { await prisma.product.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.categories) {
    try { await prisma.category.delete({ where: { id } }); } catch {}
  }
  
  for (const id of testData.users) {
    try { await prisma.user.delete({ where: { id } }); } catch {}
  }

  // Clear arrays
  testData.users = [];
  testData.products = [];
  testData.categories = [];
  testData.carts = [];
  testData.cartItems = [];
  testData.addresses = [];
  testData.orders = [];
  testData.invoices = [];
}

/**
 * Clean up specific user data
 */
export async function cleanupUserData(userId: string): Promise<void> {
  // Delete related data first
  await prisma.cartItem.deleteMany({
    where: { cart: { userId } },
  });
  await prisma.cart.deleteMany({ where: { userId } });
  await prisma.address.deleteMany({ where: { userId } });
  await prisma.invoice.deleteMany({
    where: { order: { userId } },
  });
  await prisma.orderItem.deleteMany({
    where: { order: { userId } },
  });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}
