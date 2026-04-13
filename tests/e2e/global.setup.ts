/**
 * Global Setup for Playwright E2E Tests
 * Se ejecuta antes de todos los tests para preparar el entorno
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
import { test as setup } from '@playwright/test';
import { Material, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Load test environment variables explicitly
// This ensures we use the test database, not production
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Verify we're using test database
const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.includes('test') && !databaseUrl.includes('localhost')) {
  console.error('❌ ERROR: DATABASE_URL does not point to a test database!');
  console.error('   Current:', databaseUrl.substring(0, 50) + '...');
  console.error('   E2E tests must use a test database only.');
  process.exit(1);
}

console.log('✅ Using test database:', databaseUrl.split('@')[1]?.split('/')[0] || 'localhost');

const prisma = new PrismaClient();

// Test user credentials - must match what E2E tests expect
// These should match the credentials shown in the auth page UI
// NOSONAR: These are test credentials for E2E tests only
const TEST_USERS = [
  {
    email: 'juan@example.com',
    password: 'JuanTFM2024!', // NOSONAR - Test credential
    name: 'Juan Pérez',
    role: Role.CUSTOMER,
  },
  {
    email: 'admin@3dprint.com',
    password: 'AdminTFM2024!', // NOSONAR - Test credential
    name: 'Admin Usuario',
    role: Role.ADMIN,
  },
  {
    email: 'cliente@test.com',
    password: 'ClienteTFM2024!', // NOSONAR - Test credential
    name: 'Cliente Test',
    role: Role.CUSTOMER,
  },
];

/**
 * Clean all data from the database
 * Resets the test database to a clean state
 */
async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning test database...');

  // Delete in order respecting foreign key constraints
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

/**
 * Ensure test users exist in the database
 * These users are required for E2E tests to pass
 */
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

    // Create default address for juan@example.com (for checkout tests)
    if (user.role === Role.CUSTOMER && user.email === 'juan@example.com') {
      const existingAddress = await prisma.address.findFirst({
        where: { userId: createdUser.id }
      });
      
      if (existingAddress) {
        console.log(`  ✓ ${user.email} (${user.role}) - Address exists`);
      } else {
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

/**
 * Create basic shipping configuration needed for checkout tests
 */
async function createShippingConfig(): Promise<void> {
  console.log('🚚 Creating shipping configuration...');

  // Check if shipping config already exists
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
      freeShippingFrom: 50,
      minDays: 3,
      maxDays: 5,
      isActive: true,
      isDefault: true,
      displayOrder: 1,
    },
  });

  console.log('✅ Shipping config created');
}

/**
 * Create basic site configuration
 */
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
      defaultVatRate: 21,
      lowStockThreshold: 5,
    },
  });

  console.log('✅ Site config created');
}

/**
 * Create sample categories and products for shopping tests
 */
async function createSampleProducts(): Promise<void> {
  console.log('📦 Creating sample products...');

  const existingCount = await prisma.category.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Products already exist, skipping');
    return;
  }

  // Create a sample category
  const category = await prisma.category.create({
    data: {
      name: 'Decoración',
      slug: 'decoracion',
      description: 'Productos decorativos impresos en 3D',
      isActive: true,
      displayOrder: 1,
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Jarrón Decorativo',
      slug: 'jarron-decorativo',
      description: 'Un elegante jarrón decorativo impreso en 3D',
      price: 24.99,
      stock: 10,
      material: Material.PLA,
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Soporte para Plantas',
      slug: 'soporte-plantas',
      description: 'Soporte moderno para plantas pequeñas',
      price: 18.5,
      stock: 15,
      material: Material.PLA,
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

/**
 * Create sample orders for admin tests
 * Creates orders with different statuses including DELIVERED for invoice tests
 */
async function createSampleOrders(): Promise<void> {
  console.log('📋 Creating sample orders...');

  const existingCount = await prisma.order.count();
  if (existingCount > 0) {
    console.log('  ℹ️ Orders already exist, skipping');
    return;
  }

  // Get test users
  const customer = await prisma.user.findUnique({
    where: { email: 'juan@example.com' },
  });

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@3dprint.com' },
  });

  if (!customer || !admin) {
    console.log('  ⚠️ Test users not found, skipping order creation');
    return;
  }

  // Get a product for the order
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log('  ⚠️ No products found, skipping order creation');
    return;
  }

  // Create a DELIVERED order (for invoice generation test)
  const deliveredOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-001',
      status: 'DELIVERED',
      subtotal: 24.99,
      shipping: 5.99,
      total: 36.23, // 24.99 * 1.21 + 5.99
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
          material: Material.PLA,
        },
      },
    },
  });
  console.log(`  ✓ DELIVERED order: ${deliveredOrder.orderNumber}`);

  // Create a CONFIRMED order (for status update test)
  const confirmedOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-2024-002',
      status: 'CONFIRMED',
      subtotal: 18.5,
      shipping: 5.99,
      total: 28.38, // 18.5 * 1.21 + 5.99
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
          price: 18.5,
          quantity: 1,
          subtotal: 18.5,
          category: 'Decoración',
          material: Material.PLA,
        },
      },
    },
  });
  console.log(`  ✓ CONFIRMED order: ${confirmedOrder.orderNumber}`);

  console.log('✅ Sample orders created');
}

/**
 * Verify the server is responding
 */
async function verifyServer(): Promise<void> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`🔍 Verifying server at ${baseUrl}...`);

  const maxRetries = 30;
  const retryDelay = 2000; // ms

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseUrl);
      if (response.status === 200) {
        console.log('✅ Server is responding');
        return;
      }
    } catch {
      // Server not ready yet
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`Server at ${baseUrl} did not respond after ${maxRetries} attempts`);
}

// Main setup test
setup('global setup', async () => {
  console.log('\n🔧 E2E Global Setup: Preparing test environment...\n');

  try {
    // 1. Clean the database
    await cleanDatabase();

    // 2. Create test users (required for auth tests)
    await ensureTestUsers();

    // 3. Create basic configuration
    await createSiteConfig();
    await createShippingConfig();

    // 4. Create sample products (for shopping tests)
    await createSampleProducts();

    // 5. Create sample orders (for admin tests)
    await createSampleOrders();

    // 6. Verify server is ready
    await verifyServer();

    console.log('\n✅ Setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    await prisma.$disconnect();
    throw error;
  }

  await prisma.$disconnect();
});
