import 'dotenv/config';
/**
 * Seed Script for 3D Print TFM
 * Initial database population with CSV data
 *
 * Usage: npx prisma db seed
 *
 * Loads all 16 CSV files in correct order respecting foreign keys
 *
 * ============================================
 * TEST USER CREDENTIALS (for development/testing)
 * ============================================
 *
 * MEMORABLE PASSWORDS (format: [Name][Proyecto][Year][Symbol]):
 * ┌──────────────────────┬──────────────────────┬────────────┐
 * │ Email                │ Password             │ Role       │
 * ├──────────────────────┼──────────────────────┼────────────┤
 * │ admin@3dprint.com    │ AdminTFM2024!        │ ADMIN      │
 * │ juan@example.com     │ JuanTFM2024!         │ CUSTOMER   │
 * └──────────────────────┴──────────────────────┴────────────┘
 *
 * All passwords are hashed with bcrypt (12 salt rounds) before storage.
 * Other users have cryptographically secure random passwords (12+ chars).
 *
 * ============================================
 */
import { PrismaClient, Role, Material, OrderStatus, PaymentMethod, PaymentStatus, MovementType, AlertType, AlertSeverity, AlertStatus, CouponType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import * as csvParse from 'csv-parse/sync';
import * as path from 'node:path';

const prisma = new PrismaClient();

// ============================================
// CSV INTERFACES - Match CSV column headers
// ============================================

interface UserCSV {
  _ref: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  isActive: string;
}

interface CategoryCSV {
  _ref: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: string;
  isActive: string;
}

interface AddressCSV {
  _ref: string;
  _userRef: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  isDefault: string;
}

interface ProductCSV {
  _ref: string;
  name: string;
  slug: string;
  price: string;
  stock: string;
  _categoryRef: string;
  material: string;
  description: string;
  shortDescription: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  weight: string;
  printTime: string;
  isActive: string;
  isFeatured: string;
}

interface ProductImageCSV {
  _ref: string;
  _productRef: string;
  url: string;
  filename: string;
  altText: string;
  isMain: string;
  displayOrder: string;
}

interface OrderCSV {
  _ref: string;
  orderNumber: string;
  _userRef: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  status: string;
  paymentMethod: string;
  _shippingAddressRef: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingComplement: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingProvince: string;
  shippingCountry: string;
  trackingNumber: string;
  customerNotes: string;
}

interface OrderItemCSV {
  _ref: string;
  _orderRef: string;
  _productRef: string;
  name: string;
  price: string;
  quantity: string;
  material: string;
  category: string;
  imageUrl: string;
  subtotal: string;
}

interface PaymentCSV {
  _ref: string;
  _userRef: string;
  _orderRef: string;
  amount: string;
  method: string;
  status: string;
  stripePaymentIntentId: string;
}

interface InventoryMovementCSV {
  _ref: string;
  _productRef: string;
  _orderRef: string;
  type: string;
  quantity: string;
  previousStock: string;
  newStock: string;
  reason: string;
  _createdByRef: string;
}

interface AlertCSV {
  _ref: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  _productRef: string;
  status: string;
}

interface ReviewCSV {
  _ref: string;
  _productRef: string;
  _userRef: string;
  rating: string;
  title: string;
  comment: string;
  isVerified: string;
  isApproved: string;
}

interface CouponCSV {
  _ref: string;
  code: string;
  type: string;
  value: string;
  minOrderAmount: string;
  maxUses: string;
  usedCount: string;
  validFrom: string;
  validUntil: string;
  isActive: string;
}

interface FAQCSV {
  _ref: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: string;
  isActive: string;
}

interface ShippingConfigCSV {
  _ref: string;
  name: string;
  description: string;
  price: string;
  freeShippingFrom: string;
  minDays: string;
  maxDays: string;
  isActive: string;
  isDefault: string;
  displayOrder: string;
}

interface SiteConfigCSV {
  _ref: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  companyPhone: string;
  companyEmail: string;
  defaultVatRate: string;
  lowStockThreshold: string;
}

interface InvoiceCSV {
  _ref: string;
  _orderRef: string;
  invoiceNumber: string;
  series: string;
  number: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry: string;
  subtotal: string;
  shipping: string;
  discount: string;
  taxableAmount: string;
  vatRate: string;
  vatAmount: string;
  total: string;
  pdfUrl: string;
  isCancelled: string;
  issuedAt: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseCSV<T>(fileName: string): T[] {
  const filePath = path.join(process.cwd(), 'public/data', fileName);
  const content = readFileSync(filePath, 'utf-8');
  return csvParse.parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as T[];
}

function toBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true';
}

function toDecimal(value: string): number {
  return Number.parseFloat(value) || 0;
}

function toInt(value: string): number {
  return Number.parseInt(value) || 0;
}

function toNullableString(value: string): string | null {
  return value?.trim() || null;
}

// ID mapping stores - CSV IDs to database UUIDs
const idMaps = {
  users: new Map<string, string>(),
  categories: new Map<string, string>(),
  addresses: new Map<string, string>(),
  products: new Map<string, string>(),
  orders: new Map<string, string>(),
};

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedUsers(): Promise<number> {
  console.log('👤 Creating users...');
  const usersCSV = parseCSV<UserCSV>('users.csv');
  
  for (const user of usersCSV) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const created = await prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        phone: toNullableString(user.phone),
        role: user.role as Role,
        isActive: toBoolean(user.isActive),
      },
    });
    idMaps.users.set(user._ref, created.id);
  }
  console.log(`✅ ${usersCSV.length} users created\n`);
  return usersCSV.length;
}

async function seedCategories(): Promise<number> {
  console.log('📂 Creating categories...');
  const categoriesCSV = parseCSV<CategoryCSV>('categories.csv');
  
  for (const cat of categoriesCSV) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: toNullableString(cat.description),
        image: toNullableString(cat.image),
        displayOrder: toInt(cat.displayOrder),
        isActive: toBoolean(cat.isActive),
      },
    });
    idMaps.categories.set(cat._ref, created.id);
  }
  console.log(`✅ ${categoriesCSV.length} categories created\n`);
  return categoriesCSV.length;
}

async function seedSiteConfig(): Promise<number> {
  console.log('⚙️ Creating site config...');
  const siteConfigCSV = parseCSV<SiteConfigCSV>('site_config.csv');
  
  for (const config of siteConfigCSV) {
    await prisma.siteConfig.create({
      data: {
        companyName: config.companyName,
        companyTaxId: config.companyTaxId,
        companyAddress: config.companyAddress,
        companyCity: config.companyCity,
        companyProvince: config.companyProvince,
        companyPostalCode: config.companyPostalCode,
        companyPhone: config.companyPhone,
        companyEmail: config.companyEmail,
        defaultVatRate: toDecimal(config.defaultVatRate),
        lowStockThreshold: toInt(config.lowStockThreshold),
      },
    });
  }
  console.log(`✅ ${siteConfigCSV.length} site config created\n`);
  return siteConfigCSV.length;
}

async function seedShippingConfig(): Promise<number> {
  console.log('🚚 Creating shipping configs...');
  const shippingConfigCSV = parseCSV<ShippingConfigCSV>('shipping_config.csv');
  
  for (const ship of shippingConfigCSV) {
    await prisma.shippingConfig.create({
      data: {
        name: ship.name,
        description: toNullableString(ship.description),
        price: toDecimal(ship.price),
        freeShippingFrom: ship.freeShippingFrom ? toDecimal(ship.freeShippingFrom) : null,
        minDays: toInt(ship.minDays),
        maxDays: toInt(ship.maxDays),
        isActive: toBoolean(ship.isActive),
        isDefault: toBoolean(ship.isDefault),
        displayOrder: toInt(ship.displayOrder),
      },
    });
  }
  console.log(`✅ ${shippingConfigCSV.length} shipping configs created\n`);
  return shippingConfigCSV.length;
}

async function seedFAQs(): Promise<number> {
  console.log('❓ Creating FAQs...');
  const faqsCSV = parseCSV<FAQCSV>('faqs.csv');
  
  for (const faq of faqsCSV) {
    await prisma.fAQ.create({
      data: {
        id: faq._ref, // Usar el ref como ID para permitir traducción
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        displayOrder: toInt(faq.displayOrder),
        isActive: toBoolean(faq.isActive),
      },
    });
  }
  console.log(`✅ ${faqsCSV.length} FAQs created\n`);
  return faqsCSV.length;
}

async function seedCoupons(): Promise<number> {
  console.log('🎟️ Creating coupons...');
  const couponsCSV = parseCSV<CouponCSV>('coupons.csv');
  
  for (const coupon of couponsCSV) {
    await prisma.coupon.create({
      data: {
        code: coupon.code,
        type: coupon.type as CouponType,
        value: toDecimal(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? toDecimal(coupon.minOrderAmount) : null,
        maxUses: coupon.maxUses ? toInt(coupon.maxUses) : null,
        usedCount: toInt(coupon.usedCount),
        validFrom: new Date(coupon.validFrom),
        validUntil: new Date(coupon.validUntil),
        isActive: toBoolean(coupon.isActive),
      },
    });
  }
  console.log(`✅ ${couponsCSV.length} coupons created\n`);
  return couponsCSV.length;
}

async function seedAddresses(): Promise<number> {
  console.log('📍 Creating addresses...');
  const addressesCSV = parseCSV<AddressCSV>('addresses.csv');
  
  for (const addr of addressesCSV) {
    const userId = idMaps.users.get(addr._userRef);
    if (!userId) {
      console.warn(`⚠️ User ${addr._userRef} not found for address ${addr._ref}`);
      continue;
    }
    const created = await prisma.address.create({
      data: {
        userId: userId,
        name: addr.name,
        recipient: addr.recipient,
        phone: addr.phone,
        address: addr.address,
        complement: toNullableString(addr.complement),
        postalCode: addr.postalCode,
        city: addr.city,
        province: addr.province,
        country: addr.country,
        isDefault: toBoolean(addr.isDefault),
      },
    });
    idMaps.addresses.set(addr._ref, created.id);
  }
  console.log(`✅ ${addressesCSV.length} addresses created\n`);
  return addressesCSV.length;
}

async function seedProducts(): Promise<number> {
  console.log('📦 Creating products...');
  const productsCSV = parseCSV<ProductCSV>('products.csv');
  
  for (const product of productsCSV) {
    const categoryId = idMaps.categories.get(product._categoryRef);
    if (!categoryId) {
      console.warn(`⚠️ Category ${product._categoryRef} not found for product ${product._ref}`);
      continue;
    }
    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: toNullableString(product.shortDescription),
        price: toDecimal(product.price),
        stock: toInt(product.stock),
        categoryId: categoryId,
        material: product.material as Material,
        widthCm: product.widthCm ? Number.parseFloat(product.widthCm) : null,
        heightCm: product.heightCm ? Number.parseFloat(product.heightCm) : null,
        depthCm: product.depthCm ? Number.parseFloat(product.depthCm) : null,
        weight: product.weight ? toDecimal(product.weight) : null,
        printTime: product.printTime ? toInt(product.printTime) : null,
        isActive: toBoolean(product.isActive),
        isFeatured: toBoolean(product.isFeatured),
      },
    });
    idMaps.products.set(product._ref, created.id);
  }
  console.log(`✅ ${productsCSV.length} products created\n`);
  return productsCSV.length;
}

async function seedProductImages(): Promise<number> {
  console.log('🖼️ Creating product images...');
  const productImagesCSV = parseCSV<ProductImageCSV>('product_images.csv');
  
  for (const img of productImagesCSV) {
    const productId = idMaps.products.get(img._productRef);
    if (!productId) {
      console.warn(`⚠️ Product ${img._productRef} not found for image ${img._ref}`);
      continue;
    }
    await prisma.productImage.create({
      data: {
        productId: productId,
        url: img.url,
        filename: img.filename,
        altText: img.altText,
        isMain: toBoolean(img.isMain),
        displayOrder: toInt(img.displayOrder),
      },
    });
  }
  console.log(`✅ ${productImagesCSV.length} product images created\n`);
  return productImagesCSV.length;
}

async function seedOrders(): Promise<number> {
  console.log('📋 Creating orders...');
  const ordersCSV = parseCSV<OrderCSV>('orders.csv');
  
  for (const order of ordersCSV) {
    const userId = idMaps.users.get(order._userRef);
    if (!userId) {
      console.warn(`⚠️ User ${order._userRef} not found for order ${order._ref}`);
      continue;
    }
    const shippingAddressId = order._shippingAddressRef ? idMaps.addresses.get(order._shippingAddressRef) : null;
    const created = await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        userId: userId,
        subtotal: toDecimal(order.subtotal),
        shipping: toDecimal(order.shipping),
        discount: order.discount ? toDecimal(order.discount) : null,
        total: toDecimal(order.total),
        status: order.status as OrderStatus,
        paymentMethod: order.paymentMethod as PaymentMethod,
        shippingAddressId: shippingAddressId,
        shippingName: order.shippingName,
        shippingPhone: order.shippingPhone,
        shippingAddress: order.shippingAddress,
        shippingComplement: toNullableString(order.shippingComplement),
        shippingPostalCode: order.shippingPostalCode,
        shippingCity: order.shippingCity,
        shippingProvince: order.shippingProvince,
        shippingCountry: order.shippingCountry,
        trackingNumber: toNullableString(order.trackingNumber),
        customerNotes: toNullableString(order.customerNotes),
      },
    });
    idMaps.orders.set(order._ref, created.id);
  }
  console.log(`✅ ${ordersCSV.length} orders created\n`);
  return ordersCSV.length;
}

async function seedOrderItems(): Promise<number> {
  console.log('🛒 Creating order items...');
  const orderItemsCSV = parseCSV<OrderItemCSV>('order_items.csv');
  
  for (const item of orderItemsCSV) {
    const orderId = idMaps.orders.get(item._orderRef);
    const productId = item._productRef ? idMaps.products.get(item._productRef) : null;
    if (!orderId) {
      console.warn(`⚠️ Order ${item._orderRef} not found for item ${item._ref}`);
      continue;
    }
    await prisma.orderItem.create({
      data: {
        orderId: orderId,
        productId: productId,
        name: item.name,
        price: toDecimal(item.price),
        quantity: toInt(item.quantity),
        material: item.material as Material,
        category: item.category,
        imageUrl: toNullableString(item.imageUrl),
        subtotal: toDecimal(item.subtotal),
      },
    });
  }
  console.log(`✅ ${orderItemsCSV.length} order items created\n`);
  return orderItemsCSV.length;
}

async function seedPayments(): Promise<number> {
  console.log('💳 Creating payments...');
  const paymentsCSV = parseCSV<PaymentCSV>('payments.csv');
  
  for (const payment of paymentsCSV) {
    const userId = idMaps.users.get(payment._userRef);
    const orderId = idMaps.orders.get(payment._orderRef);
    if (!userId || !orderId) {
      console.warn(`⚠️ User/Order not found for payment ${payment._ref}`);
      continue;
    }
    await prisma.payment.create({
      data: {
        orderId: orderId,
        userId: userId,
        amount: toDecimal(payment.amount),
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
        stripePaymentIntentId: toNullableString(payment.stripePaymentIntentId),
      },
    });
  }
  console.log(`✅ ${paymentsCSV.length} payments created\n`);
  return paymentsCSV.length;
}

async function seedInventoryMovements(): Promise<number> {
  console.log('📊 Creating inventory movements...');
  const inventoryCSV = parseCSV<InventoryMovementCSV>('inventory_movements.csv');
  
  for (const mov of inventoryCSV) {
    const productId = idMaps.products.get(mov._productRef);
    const orderId = mov._orderRef ? idMaps.orders.get(mov._orderRef) : null;
    const createdBy = idMaps.users.get(mov._createdByRef);
    if (!productId || !createdBy) {
      console.warn(`⚠️ Product/User not found for movement ${mov._ref}`);
      continue;
    }
    await prisma.inventoryMovement.create({
      data: {
        productId: productId,
        orderId: orderId,
        type: mov.type as MovementType,
        quantity: toInt(mov.quantity),
        previousStock: toInt(mov.previousStock),
        newStock: toInt(mov.newStock),
        reason: mov.reason,
        createdBy: createdBy,
      },
    });
  }
  console.log(`✅ ${inventoryCSV.length} inventory movements created\n`);
  return inventoryCSV.length;
}

async function seedAlerts(): Promise<number> {
  console.log('⚠️ Creating alerts...');
  const alertsCSV = parseCSV<AlertCSV>('alerts.csv');
  
  for (const alert of alertsCSV) {
    const productId = alert._productRef ? idMaps.products.get(alert._productRef) : null;
    await prisma.alert.create({
      data: {
        type: alert.type as AlertType,
        severity: alert.severity as AlertSeverity,
        title: alert.title,
        message: alert.message,
        productId: productId,
        status: alert.status as AlertStatus,
      },
    });
  }
  console.log(`✅ ${alertsCSV.length} alerts created\n`);
  return alertsCSV.length;
}

async function seedReviews(): Promise<number> {
  console.log('⭐ Creating reviews...');
  const reviewsCSV = parseCSV<ReviewCSV>('reviews.csv');
  
  for (const review of reviewsCSV) {
    const productId = idMaps.products.get(review._productRef);
    const userId = idMaps.users.get(review._userRef);
    if (!productId || !userId) {
      console.warn(`⚠️ Product/User not found for review ${review._ref}`);
      continue;
    }
    await prisma.review.create({
      data: {
        productId: productId,
        userId: userId,
        rating: toInt(review.rating),
        title: review.title,
        comment: review.comment,
        isVerified: toBoolean(review.isVerified),
        isApproved: toBoolean(review.isApproved),
      },
    });
  }
  console.log(`✅ ${reviewsCSV.length} reviews created\n`);
  return reviewsCSV.length;
}

async function seedInvoices(): Promise<number> {
  console.log('🧾 Creating invoices...');
  const invoicesCSV = parseCSV<InvoiceCSV>('invoices.csv');
  
  for (const inv of invoicesCSV) {
    const orderId = idMaps.orders.get(inv._orderRef);
    if (!orderId) {
      console.warn(`⚠️ Order ${inv._orderRef} not found for invoice ${inv._ref}`);
      continue;
    }
    await prisma.invoice.create({
      data: {
        orderId: orderId,
        invoiceNumber: inv.invoiceNumber,
        series: inv.series,
        number: toInt(inv.number),
        companyName: inv.companyName,
        companyTaxId: inv.companyTaxId,
        companyAddress: inv.companyAddress,
        companyCity: inv.companyCity,
        companyProvince: inv.companyProvince,
        companyPostalCode: inv.companyPostalCode,
        clientName: inv.clientName,
        clientTaxId: inv.clientTaxId,
        clientAddress: inv.clientAddress,
        clientCity: inv.clientCity,
        clientProvince: inv.clientProvince,
        clientPostalCode: inv.clientPostalCode,
        clientCountry: inv.clientCountry,
        subtotal: toDecimal(inv.subtotal),
        shipping: toDecimal(inv.shipping),
        discount: inv.discount ? toDecimal(inv.discount) : null,
        taxableAmount: toDecimal(inv.taxableAmount),
        vatRate: toDecimal(inv.vatRate),
        vatAmount: toDecimal(inv.vatAmount),
        total: toDecimal(inv.total),
        pdfUrl: toNullableString(inv.pdfUrl),
        isCancelled: toBoolean(inv.isCancelled),
        issuedAt: new Date(inv.issuedAt),
      },
    });
  }
  console.log(`✅ ${invoicesCSV.length} invoices created\n`);
  return invoicesCSV.length;
}

async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning existing data...');
  await prisma.$executeRaw`TRUNCATE TABLE 
    "reviews", "order_messages", "inventory_movements", "payments", 
    "order_items", "orders", "invoices", "product_images", "products", 
    "categories", "addresses", "users", "alerts", "shipping_configs", 
    "site_configs", "sessions", "verification_tokens", "audit_logs", 
    "carts", "cart_items", "coupons", "faqs" CASCADE`;
  console.log('✅ Data cleaned\n');
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  await cleanDatabase();

  // Seed all entities in dependency order
  const users = await seedUsers();
  const categories = await seedCategories();
  await seedSiteConfig();
  await seedShippingConfig();
  await seedFAQs();
  await seedCoupons();
  const addresses = await seedAddresses();
  const products = await seedProducts();
  const productImages = await seedProductImages();
  const orders = await seedOrders();
  const orderItems = await seedOrderItems();
  const payments = await seedPayments();
  const inventoryMovements = await seedInventoryMovements();
  const alerts = await seedAlerts();
  const reviews = await seedReviews();
  const invoices = await seedInvoices();

  // Summary
  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users}`);
  console.log(`   - Categories: ${categories}`);
  console.log(`   - Products: ${products}`);
  console.log(`   - Product Images: ${productImages}`);
  console.log(`   - Addresses: ${addresses}`);
  console.log(`   - Orders: ${orders}`);
  console.log(`   - Order Items: ${orderItems}`);
  console.log(`   - Payments: ${payments}`);
  console.log(`   - Inventory Movements: ${inventoryMovements}`);
  console.log(`   - Alerts: ${alerts}`);
  console.log(`   - Reviews: ${reviews}`);
  console.log(`   - Invoices: ${invoices}`);
}

main()
  .catch((e: Error) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
