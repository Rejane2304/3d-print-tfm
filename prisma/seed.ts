/**
 * Seed Script for 3D Print TFM
 * Initial database population with CSV data
 * 
 * Usage: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV<T>(fileName: string): T[] {
  const filePath = path.join(process.cwd(), 'public/data', fileName);
  const content = readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    quote: null,
  }) as T[];
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clean tables in order (respecting foreign keys)
    console.log('🧹 Cleaning existing data...');
    await prisma.$executeRaw`TRUNCATE TABLE "mensajes_pedido", "movimientos_inventario", "pagos", "items_pedido", "pedidos", "facturas", "imagenes_producto", "productos", "direcciones", "usuarios", "alertas", "configuracion_envios", "configuracion", "sesiones", "tokens_verificacion", "logs_auditoria", "carritos", "items_carrito" CASCADE`;
    console.log('✅ Data cleaned\n');

    // Create users from CSV
    console.log('👤 Creating users from CSV...');
    const usersCSV = parseCSV<{ id: string; email: string; password: string; name: string; phone: string; address: string; role: string }>('users.csv');
    
    for (const user of usersCSV) {
      const hashedPassword = user.role === 'admin' 
        ? await bcrypt.hash('admin123', 12)
        : await bcrypt.hash('pass123', 12);
      
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role === 'admin' ? 'ADMIN' : 'CLIENTE',
          isActive: true,
          phone: user.phone,
        },
      });
    }
    console.log(`✅ ${usersCSV.length} users created\n`);

    // Create products from CSV
    console.log('📦 Creating products from CSV...');
    const productsCSV = parseCSV<{ 
      id: string; 
      name: string; 
      price: string; 
      stock: string; 
      category: string; 
      material: string; 
      description: string; 
      image: string 
    }>('products.csv');

    const categoryMap: Record<string, string> = {
      'DECOR': 'DECORACION',
      'ACCESSORY': 'ACCESORIOS',
      'FUNCTIONAL': 'FUNCIONAL',
      'PIECE': 'ARTICULADOS',
      'TOY': 'JUGUETES',
    };

    for (let i = 0; i < productsCSV.length; i++) {
      const product = productsCSV[i];
      const slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await prisma.product.create({
        data: {
          name: product.name,
          slug: slug,
          description: product.description,
          shortDescription: product.description.split(',')[0],
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          category: (categoryMap[product.category] || 'ACCESORIOS') as 'DECORACION' | 'ACCESORIOS' | 'FUNCIONAL' | 'ARTICULADOS' | 'JUGUETES',
          material: product.material as 'PLA' | 'PETG',
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
    const ordersCSV = parseCSV<{ 
      id: string; 
      userId: string; 
      total: string; 
      status: string;
      paymentMethod: string;
      shippingAddress: string;
      notes: string;
    }>('orders.csv');

    const users = await prisma.user.findMany();
    const products = await prisma.product.findMany();

    const statusMap: Record<string, 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'> = {
      'PENDING': 'PENDIENTE',
      'CONFIRMED': 'CONFIRMADO',
      'SHIPPED': 'ENVIADO',
      'COMPLETED': 'ENTREGADO',
      'CANCELLED': 'CANCELADO',
    };

    for (let i = 0; i < ordersCSV.length; i++) {
      const order = ordersCSV[i];
      const user = users.find(u => u.id.includes(order.userId.replace('USER-', ''))) || users[0];
      const addressParts = order.shippingAddress.split(' - ');
      const fullAddress = addressParts[0] || order.shippingAddress;
      const postalCode = addressParts[1]?.split(' ')[0] || '28001';
      const city = addressParts[1]?.split(' ')[1] || 'Madrid';
      
      const status = statusMap[order.status] || 'PENDIENTE';
      
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
          shippingCountry: 'España',
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
    const alertsCSV = parseCSV<{ 
      id: string; 
      type: string; 
      title: string; 
      message: string; 
      status: string;
      metadata: string;
    }>('alerts.csv');

    const typeMap: Record<string, 'STOCK_BAJO' | 'SIN_STOCK' | 'PEDIDO_RETRASADO' | 'PAGO_FALLIDO' | 'ERROR_SISTEMA'> = {
      'LOW_STOCK': 'STOCK_BAJO',
      'OUT_OF_STOCK': 'SIN_STOCK',
      'ORDER_DELAYED': 'PEDIDO_RETRASADO',
      'PAYMENT_FAILED': 'PAGO_FALLIDO',
      'SYSTEM_ERROR': 'ERROR_SISTEMA',
    };

    for (const alert of alertsCSV) {
      await prisma.alert.create({
        data: {
          type: typeMap[alert.type] || 'STOCK_BAJO',
          title: alert.title || alert.message?.substring(0, 50) || 'Alerta',
          message: alert.message || '',
          severity: alert.status === 'READ' ? 'BAJA' : 'MEDIA',
          status: alert.status === 'READ' ? 'RESUELTA' : 'PENDIENTE',
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
  .catch((e) => {
    console.error(e);
    throw e;
  });
