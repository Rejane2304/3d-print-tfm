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
import {
  type CouponType,
  type Material,
  type MovementType,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  PrismaClient,
  type Role,
} from '@prisma/client';
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
  nameEs: string;
  nameEn: string;
  slug: string;
  price: string;
  stock: string;
  _categoryRef: string;
  material: string;
  descriptionEs: string;
  descriptionEn: string;
  shortDescEs: string;
  shortDescEn: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  weight: string;
  printTime: string;
  isActive: string;
  isFeatured: string;
  metaTitleEs: string;
  metaTitleEn: string;
  metaDescEs: string;
  metaDescEn: string;
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
   
  // console.log(`✅ ${usersCSV.length} users created\n`);
  return usersCSV.length;
}

async function seedCategories(): Promise<number> {
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

  return categoriesCSV.length;
}

async function seedSiteConfig(): Promise<number> {
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

  return siteConfigCSV.length;
}

async function seedShippingConfig(): Promise<number> {
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
  return shippingConfigCSV.length;
}

async function seedShippingZones(): Promise<number> {
  const defaultZones = [
    {
      name: 'Península',
      country: 'España',
      regions: [
        'Madrid',
        'Barcelona',
        'Valencia',
        'Sevilla',
        'Zaragoza',
        'Málaga',
        'Murcia',
        'Palma',
        'Las Palmas',
        'Bilbao',
        'Alicante',
        'Córdoba',
        'Valladolid',
        'Vigo',
        'Gijón',
        'LHospitalet',
        'Vitoria',
        'La Coruña',
        'Elche',
        'Granada',
        'Terrassa',
        'Tarragona',
        'Pamplona',
        'León',
        'Albacete',
        'Cádiz',
        'Logroño',
        'Huelva',
        'Salamanca',
        'Burgos',
        'Almería',
        'Castellón de la Plana',
        'Alcorcón',
        'Gasteiz/Vitoria',
        'Guadalajara',
        'San Cristóbal de La Laguna',
        'Badalona',
        'Santander',
        'Torrejón de Ardoz',
        'Sabadell',
        'San Sebastián',
        'Cartagena',
        'Móstoles',
        'Fuenlabrada',
        'Getafe',
        'Leganés',
        'Baracaldo',
        'Getxo',
        'Badajoz',
        'Algeciras',
        'Marbella',
        'Santiago de Compostela',
        'Cáceres',
        'Segovia',
        'Ciudad Real',
        'Toledo',
        'Huesca',
        'Soria',
        'Zamora',
        'Ávila',
        'Palencia',
        'Cuenca',
      ],
      postalCodePrefixes: [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44',
        '45',
        '46',
        '47',
        '48',
        '49',
        '50',
      ],
      baseCost: 5.99,
      freeShippingThreshold: 50,
      estimatedDaysMin: 3,
      estimatedDaysMax: 5,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Islas Baleares',
      country: 'España',
      regions: ['Mallorca', 'Menorca', 'Ibiza', 'Formentera'],
      postalCodePrefixes: ['07'],
      baseCost: 7.99,
      freeShippingThreshold: 75,
      estimatedDaysMin: 4,
      estimatedDaysMax: 7,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Islas Canarias',
      country: 'España',
      regions: ['Tenerife', 'Gran Canaria', 'Lanzarote', 'Fuerteventura', 'La Palma', 'La Gomera', 'El Hierro'],
      postalCodePrefixes: ['35', '38'],
      baseCost: 9.99,
      freeShippingThreshold: 100,
      estimatedDaysMin: 5,
      estimatedDaysMax: 10,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Ceuta y Melilla',
      country: 'España',
      regions: ['Ceuta', 'Melilla'],
      postalCodePrefixes: ['51', '52'],
      baseCost: 12.99,
      freeShippingThreshold: null,
      estimatedDaysMin: 5,
      estimatedDaysMax: 8,
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const zone of defaultZones) {
    await prisma.shippingZone.create({
      data: {
        name: zone.name,
        country: zone.country,
        regions: zone.regions,
        postalCodePrefixes: zone.postalCodePrefixes,
        baseCost: zone.baseCost,
        freeShippingThreshold: zone.freeShippingThreshold,
        estimatedDaysMin: zone.estimatedDaysMin,
        estimatedDaysMax: zone.estimatedDaysMax,
        isActive: zone.isActive,
        displayOrder: zone.displayOrder,
      },
    });
  }

  return defaultZones.length;
}

async function seedFAQs(): Promise<number> {
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

  return faqsCSV.length;
}

async function seedCoupons(): Promise<number> {
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

  return couponsCSV.length;
}

async function seedAddresses(): Promise<number> {
  const addressesCSV = parseCSV<AddressCSV>('addresses.csv');

  for (const addr of addressesCSV) {
    const userId = idMaps.users.get(addr._userRef);
    if (!userId) {
       
      process.stderr.write(`⚠️ User ${addr._userRef} not found for address ${addr._ref}\n`);
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
  process.stdout.write(`✅ ${addressesCSV.length} addresses created\n`);
  return addressesCSV.length;
}

async function seedProducts(): Promise<number> {
  process.stdout.write('📦 Creating products...\n');
  const productsCSV = parseCSV<ProductCSV>('products.csv');

  for (const product of productsCSV) {
    const categoryId = idMaps.categories.get(product._categoryRef);
    if (!categoryId) {
      process.stderr.write(`⚠️ Category ${product._categoryRef} not found for product ${product._ref}\n`);
      continue;
    }
    const created = await prisma.product.create({
      data: {
        // Bilingual fields (new)
        nameEs: product.nameEs,
        nameEn: product.nameEn,
        descriptionEs: product.descriptionEs,
        descriptionEn: product.descriptionEn,
        shortDescEs: toNullableString(product.shortDescEs),
        shortDescEn: toNullableString(product.shortDescEn),
        metaTitleEs: toNullableString(product.metaTitleEs),
        metaTitleEn: toNullableString(product.metaTitleEn),
        metaDescEs: toNullableString(product.metaDescEs),
        metaDescEn: toNullableString(product.metaDescEn),
        // Legacy fields (copy from English for backwards compatibility)
        name: product.nameEn,
        description: product.descriptionEn,
        shortDescription: toNullableString(product.shortDescEn),
        metaTitle: toNullableString(product.metaTitleEn),
        metaDescription: toNullableString(product.metaDescEn),
        // Other fields
        slug: product.slug,
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
  process.stdout.write(`✅ ${productsCSV.length} products created\n`);
  return productsCSV.length;
}

async function seedProductImages(): Promise<number> {
  process.stdout.write('🖼️ Creating product images...\n');
  const productImagesCSV = parseCSV<ProductImageCSV>('product_images.csv');

  for (const img of productImagesCSV) {
    const productId = idMaps.products.get(img._productRef);
    if (!productId) {
      process.stderr.write(`⚠️ Product ${img._productRef} not found for image ${img._ref}\n`);
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
  process.stdout.write(`✅ ${productImagesCSV.length} product images created\n`);
  return productImagesCSV.length;
}

async function seedOrders(): Promise<number> {
  process.stdout.write('📋 Creating orders...\n');
  const ordersCSV = parseCSV<OrderCSV>('orders.csv');

  // Base date for order timestamps (30 days ago)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  for (const order of ordersCSV) {
    const userId = idMaps.users.get(order._userRef);
    if (!userId) {
      process.stderr.write(`⚠️ User ${order._userRef} not found for order ${order._ref}\n`);
      continue;
    }

    const shippingAddressId = order._shippingAddressRef ? idMaps.addresses.get(order._shippingAddressRef) : null;

    // Calculate timestamps based on order status for realistic data
    const orderDate = new Date(baseDate);
    orderDate.setDate(orderDate.getDate() + Math.floor(Math.random() * 30)); // Random day within last 30 days

    const orderData = {
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
      createdAt: orderDate,
      // Campos opcionales para los timestamps de estado
      confirmedAt: undefined as Date | undefined,
      preparingAt: undefined as Date | undefined,
      shippedAt: undefined as Date | undefined,
      deliveredAt: undefined as Date | undefined,
      cancelledAt: undefined as Date | undefined,
    };

    // Add timestamps based on status for realistic order flow
    switch (order.status) {
      case 'DELIVERED':
        orderData.confirmedAt = new Date(orderDate.getTime() + 3600000); // 1 hour later
        orderData.preparingAt = new Date(orderDate.getTime() + 86400000); // 1 day later
        orderData.shippedAt = new Date(orderDate.getTime() + 172800000); // 2 days later
        orderData.deliveredAt = new Date(orderDate.getTime() + 432000000); // 5 days later
        break;
      case 'SHIPPED':
        orderData.confirmedAt = new Date(orderDate.getTime() + 3600000);
        orderData.preparingAt = new Date(orderDate.getTime() + 86400000);
        orderData.shippedAt = new Date(orderDate.getTime() + 172800000);
        break;
      case 'PREPARING':
        orderData.confirmedAt = new Date(orderDate.getTime() + 3600000);
        orderData.preparingAt = new Date(orderDate.getTime() + 86400000);
        break;
      case 'CONFIRMED':
        orderData.confirmedAt = new Date(orderDate.getTime() + 3600000);
        break;
      case 'CANCELLED':
        orderData.cancelledAt = new Date(orderDate.getTime() + 7200000); // 2 hours later
        break;
    }

    const created = await prisma.order.create({
      data: orderData,
    });
    idMaps.orders.set(order._ref, created.id);
  }

  return ordersCSV.length;
}

async function seedOrderItems(): Promise<number> {
  const orderItemsCSV = parseCSV<OrderItemCSV>('order_items.csv');

  for (const item of orderItemsCSV) {
    const orderId = idMaps.orders.get(item._orderRef);
    const productId = item._productRef ? idMaps.products.get(item._productRef) : null;
    if (!orderId) {
       
      process.stderr.write(`⚠️ Order ${item._orderRef} not found for item ${item._ref}\n`);
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
  process.stdout.write(`✅ ${orderItemsCSV.length} order items created\n`);
  return orderItemsCSV.length;
}

async function seedPayments(): Promise<number> {
  process.stdout.write('💳 Creating payments...\n');
  const paymentsCSV = parseCSV<PaymentCSV>('payments.csv');

  for (const payment of paymentsCSV) {
    const userId = idMaps.users.get(payment._userRef);
    const orderId = idMaps.orders.get(payment._orderRef);
    if (!userId || !orderId) {
      process.stderr.write(`⚠️ User/Order not found for payment ${payment._ref}\n`);
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
  process.stdout.write(`✅ ${paymentsCSV.length} payments created\n`);
  return paymentsCSV.length;
}

async function seedInventoryMovements(): Promise<number> {
  process.stdout.write('📊 Creating inventory movements...\n');
  const inventoryCSV = parseCSV<InventoryMovementCSV>('inventory_movements.csv');

  for (const mov of inventoryCSV) {
    const productId = idMaps.products.get(mov._productRef);
    const orderId = mov._orderRef ? idMaps.orders.get(mov._orderRef) : null;
    const createdBy = idMaps.users.get(mov._createdByRef);
    if (!productId || !createdBy) {
      process.stderr.write(`⚠️ Product/User not found for movement ${mov._ref}\n`);
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
  process.stdout.write(`✅ ${inventoryCSV.length} inventory movements created\n`);
  return inventoryCSV.length;
}

async function seedReviews(): Promise<number> {
  process.stdout.write('⭐ Creating reviews...\n');
  const reviewsCSV = parseCSV<ReviewCSV>('reviews.csv');

  for (const review of reviewsCSV) {
    const productId = idMaps.products.get(review._productRef);
    const userId = idMaps.users.get(review._userRef);
    if (!productId || !userId) {
      process.stderr.write(`⚠️ Product/User not found for review ${review._ref}\n`);
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
  process.stdout.write(`✅ ${reviewsCSV.length} reviews created\n`);
  return reviewsCSV.length;
}

async function seedInvoices(): Promise<number> {
  process.stdout.write('🧾 Creating invoices...\n');
  const invoicesCSV = parseCSV<InvoiceCSV>('invoices.csv');

  for (const inv of invoicesCSV) {
    const orderId = idMaps.orders.get(inv._orderRef);
    if (!orderId) {
       
      process.stderr.write(`⚠️ Order ${inv._orderRef} not found for invoice ${inv._ref}\n`);
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
        clientName: inv.clientName, // <-- Añadido para cumplir con el tipo requerido
        clientTaxId: inv.clientTaxId,
        clientAddress: inv.clientAddress,
        clientCity: inv.clientCity,
        clientProvince: inv.clientProvince,
        clientPostalCode: inv.clientPostalCode,
        clientCountry: inv.clientCountry,
        subtotal: toDecimal(inv.subtotal),
        shipping: toDecimal(inv.shipping),
        discount: inv.discount ? toDecimal(inv.discount) : null,
        vatRate: toDecimal(inv.vatRate),
        vatAmount: toDecimal(inv.vatAmount),
        total: toDecimal(inv.total),
        pdfUrl: toNullableString(inv.pdfUrl),
        isCancelled: toBoolean(inv.isCancelled),
        issuedAt: new Date(inv.issuedAt),
      },
    });
  }

  // Si reviewsCSV no existe, solo muestra invoices creadas
  // console.log(`✅ ${invoicesCSV.length} invoices created\n`); // Removed to fix no-console lint error
  return invoicesCSV.length;
}

async function cleanDatabase(): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE
    "reviews", "order_messages", "inventory_movements", "payments",
    "order_items", "orders", "invoices", "product_images", "products",
    "categories", "addresses", "users", "shipping_configs",
    "shipping_zones", "site_configs", "sessions", "verification_tokens", "audit_logs",
    "carts", "cart_items", "coupons", "faqs" CASCADE`;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main(): Promise<void> {
   
  console.info('🌱 Starting database seed...\n');

  await cleanDatabase();

  // Seed all entities in dependency order
  await seedUsers();
  await seedCategories();
  await seedSiteConfig();
  await seedShippingConfig();
  await seedShippingZones();
  await seedFAQs();
  await seedCoupons();
  await seedAddresses();
  await seedProducts();
  const productImages = await seedProductImages();
  await seedOrders();
  const orderItems = await seedOrderItems();
  await seedPayments();
  await seedInventoryMovements();
  await seedReviews();
  await seedInvoices();

  // Summary
   
  console.info('✅ Seed completed successfully!');
   
  console.log(`   - Product Images: ${productImages}`);

   
  console.log(`   - Order Items: ${orderItems}`);
}

main()
  .catch((e: Error) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
