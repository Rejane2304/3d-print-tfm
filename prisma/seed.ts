/**
 * Seed Script for 3D Print TFM
 * Initial database population with CSV data
 * 
 * Usage: npx prisma db seed
 */
import { PrismaClient, Role, Category, Material, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import * as csvParse from 'csv-parse/sync';
import * as path from 'path';

const prisma = new PrismaClient();

interface UserCSV {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  role: string;
}

interface ProductCSV {
  id: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  material: string;
  description: string;
  image: string;
}

interface OrderCSV {
  id: string;
  userId: string;
  total: string;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  notes: string;
}

interface AlertCSV {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  metadata: string;
}

function parseCSV<T>(fileName: string): T[] {
  const filePath = path.join(process.cwd(), 'public/data', fileName);
  const content = readFileSync(filePath, 'utf-8');
  return csvParse.parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    quote: null,
  }) as T[];
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clean tables in order (respecting foreign keys)
    console.log('🧹 Cleaning existing data...');
    await prisma.$executeRaw`TRUNCATE TABLE "mensajes_pedido", "movimientos_inventario", "pagos", "items_pedido", "pedidos", "facturas", "imagenes_producto", "productos", "direcciones", "usuarios", "alertas", "configuracion_envios", "configuracion", "sesiones", "tokens_verificacion", "logs_auditoria", "carritos", "items_carrito" CASCADE`;
    console.log('✅ Data cleaned\n');

    // Create users from CSV
    console.log('👤 Creating users from CSV...');
    const usersCSV = parseCSV<UserCSV>('users.csv');
    
    for (const user of usersCSV) {
      const hashedPassword = user.role === 'admin' 
        ? await bcrypt.hash('admin123', 12)
        : await bcrypt.hash('pass123', 12);
      
      const role: Role = user.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
      
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: role,
          isActive: true,
          phone: user.phone,
        },
      });
    }
    console.log(`✅ ${usersCSV.length} users created\n`);

    // Create products from CSV
    console.log('📦 Creating products from CSV...');
    const productsCSV = parseCSV<ProductCSV>('products.csv');

    const categoryMap: Record<string, Category> = {
      'DECOR': 'DECORATION',
      'ACCESSORY': 'ACCESSORIES',
      'FUNCTIONAL': 'FUNCTIONAL',
      'PIECE': 'ARTICULATED',
      'TOY': 'TOYS',
    };

    for (let i = 0; i < productsCSV.length; i++) {
      const product = productsCSV[i];
      const slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const category: Category = categoryMap[product.category] || 'ACCESSORIES';
      const material = product.material as Material;

      await prisma.product.create({
        data: {
          name: product.name,
          slug: slug,
          description: product.description,
          shortDescription: product.description.split(',')[0],
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          category: category,
          material: material,
          isActive: true,
          isFeatured: i < 3,
          images: {
            create: {
              url: product.image,
              filename: product.image.split('/').pop() || 'imagen.jpg',
              altText: product.name,
              isMain: true,
              displayOrder: 0,
            },
          },
        },
      });
    }
    console.log(`✅ ${productsCSV.length} products created\n`);

    // Create orders from CSV
    console.log('📋 Creating orders from CSV...');
    const ordersCSV = parseCSV<OrderCSV>('orders.csv');

    const users = await prisma.user.findMany();
    const products = await prisma.product.findMany();

    const statusMap: Record<string, OrderStatus> = {
      'PENDING': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'SHIPPED': 'SHIPPED',
      'COMPLETED': 'DELIVERED',
      'CANCELLED': 'CANCELLED',
    };

    for (let i = 0; i < ordersCSV.length; i++) {
      const order = ordersCSV[i];
      const user = users.find((u: { id: string }) => u.id.includes(order.userId.replace('USER-', ''))) || users[0];
      const addressParts = order.shippingAddress.split(' - ');
      const fullAddress = addressParts[0] || order.shippingAddress;
      const postalCode = addressParts[1]?.split(' ')[0] || '28001';
      const city = addressParts[1]?.split(' ')[1] || 'Madrid';
      
      const status: OrderStatus = statusMap[order.status] || 'PENDING';
      
      const productIndex = i % products.length;
      const product = products[productIndex];
      const quantity = Math.floor(Math.random() * 2) + 1;
      const subtotal = product.price.toNumber() * quantity;
      
      await prisma.order.create({
        data: {
          orderNumber: `P-${order.id.replace('ORD-', '')}`,
          userId: user.id,
          subtotal: subtotal,
          shipping: 3.99,
          total: subtotal + 3.99,
          status: status,
          shippingAddress: fullAddress,
          shippingName: user.name,
          shippingPhone: user.phone || '600000000',
          shippingPostalCode: postalCode,
          shippingCity: city,
          shippingProvince: 'Madrid',
          shippingCountry: 'Spain',
          customerNotes: order.notes || null,
          items: {
            create: {
              productId: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              quantity: quantity,
              category: product.category,
              material: product.material,
              subtotal: subtotal,
            },
          },
        },
      });
    }
    console.log(`✅ ${ordersCSV.length} orders created\n`);

    // Create alerts from CSV
    console.log('⚠️ Creating alerts from CSV...');
    const alertsCSV = parseCSV<AlertCSV>('alerts.csv');

    const typeMap: Record<string, 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ORDER_DELAYED' | 'PAYMENT_FAILED' | 'SYSTEM_ERROR'> = {
      'LOW_STOCK': 'LOW_STOCK',
      'OUT_OF_STOCK': 'OUT_OF_STOCK',
      'ORDER_DELAYED': 'ORDER_DELAYED',
      'PAYMENT_FAILED': 'PAYMENT_FAILED',
      'SYSTEM_ERROR': 'SYSTEM_ERROR',
    };

    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      'READ': 'LOW',
      'UNREAD': 'MEDIUM',
    };

    const alertStatusMap: Record<string, 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED'> = {
      'READ': 'RESOLVED',
      'UNREAD': 'PENDING',
    };

    for (const alert of alertsCSV) {
      const alertType = typeMap[alert.type] || 'LOW_STOCK';
      const severity = severityMap[alert.status] || 'MEDIUM';
      const alertStatus = alertStatusMap[alert.status] || 'PENDING';
      
      await prisma.alert.create({
        data: {
          type: alertType,
          title: alert.title || alert.message?.substring(0, 50) || 'Alert',
          message: alert.message || '',
          severity: severity,
          status: alertStatus,
        },
      });
    }
    console.log(`✅ ${alertsCSV.length} alerts created\n`);

    console.log('✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${usersCSV.length}`);
    console.log(`   - Products: ${productsCSV.length}`);
    console.log(`   - Orders: ${ordersCSV.length}`);
    console.log(`   - Alerts: ${alertsCSV.length}`);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e: Error) => {
    console.error(e);
    throw e;
  });
