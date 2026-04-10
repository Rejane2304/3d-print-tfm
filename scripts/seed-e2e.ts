#!/usr/bin/env node
/**
 * Seed script for E2E test database
 * Populates the test database with required data
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test user credentials - must match what E2E tests expect
const TEST_USERS = [
  {
    email: 'juan@example.com',
    password: 'JuanTFM2024!',
    name: 'Juan Pérez',
    role: Role.CUSTOMER,
  },
  {
    email: 'admin@3dprint.com',
    password: 'AdminTFM2024!',
    name: 'Admin Usuario',
    role: Role.ADMIN,
  },
  {
    email: 'cliente@test.com',
    password: 'ClienteTFM2024!',
    name: 'Cliente Test',
    role: Role.CUSTOMER,
  },
];

async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning test database...');

  await prisma.$executeRaw`
    TRUNCATE TABLE
      "reviews",
      "order_messages",
      "inventory_movements",
      "payments",
      "order_items",
      "orders",
      "invoices",
      "product_images",
      "products",
      "categories",
      "addresses",
      "users",
      "shipping_configs",
      "shipping_zones",
      "site_configs",
      "sessions",
      "verification_tokens",
      "audit_logs",
      "carts",
      "cart_items",
      "coupons",
      "faqs"
    CASCADE
  `;

  console.log('✅ Database cleaned');
}

async function ensureTestUsers(): Promise<void> {
  console.log('👤 Creating test users...');

  for (const user of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 12);

    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        name: user.name,
        role: user.role,
        isActive: true,
      },
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        role: user.role,
        isActive: true,
      },
    });

    // Create default address for juan@example.com
    if (user.role === Role.CUSTOMER && user.email === 'juan@example.com') {
      const existingAddress = await prisma.address.findFirst({
        where: { userId: createdUser.id }
      });
      
      if (!existingAddress) {
        await prisma.address.create({
          data: {
            userId: createdUser.id,
            name: 'Casa',
            recipient: user.name,
            phone: '+34 600 123 456',
            address: 'Calle Mayor 123',
            complement: '2º A',
            postalCode: '28001',
            city: 'Madrid',
            province: 'Madrid',
            isDefault: true,
          },
        });
        console.log(`  ✓ ${user.email} (${user.role}) - Address created`);
      }
    } else {
      console.log(`  ✓ ${user.email} (${user.role})`);
    }
  }

  console.log(`✅ ${TEST_USERS.length} test users created`);
}

async function createShippingConfig(): Promise<void> {
  console.log('🚚 Creating shipping configuration...');

  const existingCount = await prisma.shippingConfig.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Shipping config already exists, skipping');
    return;
  }

  await prisma.shippingConfig.create({
    data: {
      name: 'Envío Estándar',
      description: 'Entrega en 3-5 días hábiles',
      price: 5.99,
      freeShippingFrom: 50.00,
      minDays: 3,
      maxDays: 5,
      isActive: true,
      isDefault: true,
      displayOrder: 1,
    },
  });

  console.log('✅ Shipping config created');
}

async function createSiteConfig(): Promise<void> {
  console.log('⚙️ Creating site configuration...');

  const existingCount = await prisma.siteConfig.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Site config already exists, skipping');
    return;
  }

  await prisma.siteConfig.create({
    data: {
      companyName: '3D Print Test',
      companyTaxId: 'B12345678',
      companyAddress: 'Calle de Pruebas 123',
      companyCity: 'Madrid',
      companyProvince: 'Madrid',
      companyPostalCode: '28001',
      companyPhone: '+34 91 123 4567',
      companyEmail: 'test@3dprint.com',
      defaultVatRate: 21.00,
      lowStockThreshold: 5,
    },
  });

  console.log('✅ Site config created');
}

async function createSampleProducts(): Promise<void> {
  console.log('📦 Creating sample products...');

  const existingCount = await prisma.category.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Products already exist, skipping');
    return;
  }

  const category = await prisma.category.create({
    data: {
      name: 'Decoración',
      slug: 'decoracion',
      description: 'Productos decorativos impresos en 3D',
      isActive: true,
      displayOrder: 1,
    },
  });

  const products = [
    {
      name: 'Jarrón Decorativo',
      slug: 'jarron-decorativo',
      description: 'Un elegante jarrón decorativo impreso en 3D',
      price: 24.99,
      stock: 10,
      material: 'PLA',
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Soporte para Plantas',
      slug: 'soporte-plantas',
      description: 'Soporte moderno para plantas pequeñas',
      price: 18.50,
      stock: 15,
      material: 'PLA',
      isActive: true,
      isFeatured: false,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        categoryId: category.id,
      },
    });
    console.log(`  ✓ ${product.name}`);
  }

  console.log('✅ Sample products created');
}

async function createSampleOrders(): Promise<void> {
  console.log('📋 Creating sample orders...');

  const existingCount = await prisma.order.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Orders already exist, skipping');
    return;
  }

  const customer = await prisma.user.findUnique({
    where: { email: 'juan@example.com' },
  });

  if (!customer) {
    console.log('  ⚠️ Test user not found, skipping order creation');
    return;
  }

  const product = await prisma.product.findFirst();
  if (!product) {
    console.log('  ⚠️ No products found, skipping order creation');
    return;
  }

  const deliveredOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-001',
      status: 'DELIVERED',
      subtotal: 24.99,
      shipping: 5.99,
      total: 36.23,
      shippingName: customer.name,
      shippingPhone: '+34 600 123 456',
      shippingAddress: 'Calle Mayor 123',
      shippingPostalCode: '28001',
      shippingCity: 'Madrid',
      shippingProvince: 'Madrid',
      shippingCountry: 'Spain',
      paymentMethod: 'CARD',
      items: {
        create: {
          productId: product.id,
          name: product.name,
          price: 24.99,
          quantity: 1,
          subtotal: 24.99,
          category: 'Decoración',
          material: 'PLA',
        },
      },
    },
  });
  console.log(`  ✓ DELIVERED order: ${deliveredOrder.orderNumber}`);

  const confirmedOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-002',
      status: 'CONFIRMED',
      subtotal: 18.50,
      shipping: 5.99,
      total: 28.38,
      shippingName: customer.name,
      shippingPhone: '+34 600 123 456',
      shippingAddress: 'Calle Mayor 123',
      shippingPostalCode: '28001',
      shippingCity: 'Madrid',
      shippingProvince: 'Madrid',
      shippingCountry: 'Spain',
      paymentMethod: 'PAYPAL',
      items: {
        create: {
          productId: product.id,
          name: product.name,
          price: 18.50,
          quantity: 1,
          subtotal: 18.50,
          category: 'Decoración',
          material: 'PLA',
        },
      },
    },
  });
  console.log(`  ✓ CONFIRMED order: ${confirmedOrder.orderNumber}`);

  console.log('✅ Sample orders created');
}

async function main() {
  console.log('\n🌱 Seeding test database...\n');

  try {
    await cleanDatabase();
    await ensureTestUsers();
    await createSiteConfig();
    await createShippingConfig();
    await createSampleProducts();
    await createSampleOrders();

    console.log('\n✅ Test database seeded successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
