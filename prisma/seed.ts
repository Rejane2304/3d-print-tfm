/**
 * Script de Seed para 3D Print TFM
 * Población inicial de la base de datos con datos de los archivos CSV
 * 
 * Uso: npx prisma db seed
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
  console.log('🌱 Iniciando seed de la base de datos...\n');

  try {
    // Limpiar tablas en orden (respetando foreign keys)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.$executeRaw`TRUNCATE TABLE "mensajes_pedido", "movimientos_inventario", "pagos", "items_pedido", "pedidos", "facturas", "imagenes_producto", "productos", "direcciones", "usuarios", "alertas", "configuracion_envios", "configuracion", "sesiones", "tokens_verificacion", "logs_auditoria", "carritos", "items_carrito" CASCADE`;
    console.log('✅ Datos limpiados\n');

    // Crear usuarios desde CSV
    console.log('👤 Creando usuarios desde CSV...');
    const usersCSV = parseCSV<{ id: string; email: string; password: string; name: string; phone: string; address: string; role: string }>('users.csv');
    
    for (const user of usersCSV) {
      const hashedPassword = user.role === 'admin' 
        ? await bcrypt.hash('admin123', 12)
        : await bcrypt.hash('pass123', 12);
      
      await prisma.usuario.create({
        data: {
          email: user.email,
          nombre: user.name,
          password: hashedPassword,
          rol: user.role === 'admin' ? 'ADMIN' : 'CLIENTE',
          activo: true,
          telefono: user.phone,
        },
      });
    }
    console.log(`✅ ${usersCSV.length} usuarios creados\n`);

    // Crear productos desde CSV
    console.log('📦 Creando productos desde CSV...');
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

      await prisma.producto.create({
        data: {
          nombre: product.name,
          slug: slug,
          descripcion: product.description,
          descripcionCorta: product.description.split(',')[0],
          precio: parseFloat(product.price),
          stock: parseInt(product.stock),
          categoria: (categoryMap[product.category] || 'ACCESORIOS') as 'DECORACION' | 'ACCESORIOS' | 'FUNCIONAL' | 'ARTICULADOS' | 'JUGUETES',
          material: product.material as 'PLA' | 'PETG',
          activo: true,
          destacado: i < 3,
          imagenes: {
            create: {
              url: product.image,
              nombreArchivo: product.image.split('/').pop() || 'imagen.jpg',
              textoAlt: product.name,
              esPrincipal: true,
              orden: 0,
            },
          },
        },
      });
    }
    console.log(`✅ ${productsCSV.length} productos creados\n`);

    // Crear pedidos desde CSV
    console.log('📋 Creando pedidos desde CSV...');
    const ordersCSV = parseCSV<{ 
      id: string; 
      userId: string; 
      total: string; 
      status: string;
      paymentMethod: string;
      shippingAddress: string;
      notes: string;
    }>('orders.csv');

    const usuarios = await prisma.usuario.findMany();
    const productos = await prisma.producto.findMany();

    const estadoMap: Record<string, 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'> = {
      'PENDING': 'PENDIENTE',
      'CONFIRMED': 'CONFIRMADO',
      'SHIPPED': 'ENVIADO',
      'COMPLETED': 'ENTREGADO',
      'CANCELLED': 'CANCELADO',
    };

    for (let i = 0; i < ordersCSV.length; i++) {
      const order = ordersCSV[i];
      const usuario = usuarios.find(u => u.id.includes(order.userId.replace('USER-', ''))) || usuarios[0];
      const addressParts = order.shippingAddress.split(' - ');
      const fullAddress = addressParts[0] || order.shippingAddress;
      const postalCode = addressParts[1]?.split(' ')[0] || '28001';
      const city = addressParts[1]?.split(' ')[1] || 'Madrid';
      
      const estado = estadoMap[order.status] || 'PENDIENTE';
      
      const productoIndex = i % productos.length;
      const producto = productos[productoIndex];
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const subtotal = producto.precio.toNumber() * cantidad;
      
      await prisma.pedido.create({
        data: {
          numeroPedido: `P-${order.id.replace('ORD-', '')}`,
          usuarioId: usuario.id,
          subtotal: subtotal,
          envio: 3.99,
          total: subtotal + 3.99,
          estado: estado,
          direccionEnvio: fullAddress,
          nombreEnvio: usuario.nombre,
          telefonoEnvio: usuario.telefono || '600000000',
          codigoPostalEnvio: postalCode,
          ciudadEnvio: city,
          provinciaEnvio: 'Madrid',
          paisEnvio: 'España',
          notasCliente: order.notes || null,
          items: {
            create: {
              productoId: producto.id,
              nombre: producto.nombre,
              descripcion: producto.descripcion,
              precio: producto.precio,
              cantidad: cantidad,
              categoria: producto.categoria,
              material: producto.material,
              subtotal: subtotal,
            },
          },
        },
      });
    }
    console.log(`✅ ${ordersCSV.length} pedidos creados\n`);

    // Crear alertas desde CSV
    console.log('⚠️ Creando alertas desde CSV...');
    const alertsCSV = parseCSV<{ 
      id: string; 
      type: string; 
      title: string; 
      message: string; 
      status: string;
      metadata: string;
    }>('alerts.csv');

    const tipoMap: Record<string, 'STOCK_BAJO' | 'SIN_STOCK' | 'PEDIDO_RETRASADO' | 'PAGO_FALLIDO' | 'ERROR_SISTEMA'> = {
      'LOW_STOCK': 'STOCK_BAJO',
      'OUT_OF_STOCK': 'SIN_STOCK',
      'ORDER_DELAYED': 'PEDIDO_RETRASADO',
      'PAYMENT_FAILED': 'PAGO_FALLIDO',
      'SYSTEM_ERROR': 'ERROR_SISTEMA',
    };

    for (const alert of alertsCSV) {
      await prisma.alerta.create({
        data: {
          tipo: tipoMap[alert.type] || 'STOCK_BAJO',
          titulo: alert.title || alert.message?.substring(0, 50) || 'Alerta',
          mensaje: alert.message || '',
          severidad: alert.status === 'READ' ? 'BAJA' : 'MEDIA',
          estado: alert.status === 'READ' ? 'RESUELTA' : 'PENDIENTE',
        },
      });
    }
    console.log(`✅ ${alertsCSV.length} alertas creadas\n`);

    console.log('✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Usuarios: ${usersCSV.length}`);
    console.log(`   - Productos: ${productsCSV.length}`);
    console.log(`   - Pedidos: ${ordersCSV.length}`);
    console.log(`   - Alertas: ${alertsCSV.length}`);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
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
