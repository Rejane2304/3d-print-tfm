/**
 * Script de Seed para 3D Print TFM
 * Población inicial de la base de datos con datos de prueba
 * 
 * Uso: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  try {
    // Limpiar tablas en orden (respetando foreign keys)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.$executeRaw`TRUNCATE TABLE "MensajePedido", "MovimientoInventario", "Pago", "ItemPedido", "Pedido", "Factura", "ImagenProducto", "Producto", "Direccion", "Usuario", "Alerta" CASCADE`;
    console.log('✅ Datos limpiados\n');

    // Crear usuarios de prueba
    console.log('👤 Creando usuarios...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const clientPassword = await bcrypt.hash('pass123', 12);

    await prisma.usuario.create({
      data: {
        email: 'admin@3dprint.com',
        nombre: 'Administrador',
        password: adminPassword,
        rol: 'ADMIN',
        activo: true,
      },
    });

    await prisma.usuario.create({
      data: {
        email: 'juan@example.com',
        nombre: 'Juan Pérez',
        password: clientPassword,
        rol: 'CLIENTE',
        activo: true,
      },
    });
    console.log('✅ 2 usuarios creados\n');

    // Crear productos de ejemplo
    console.log('📦 Creando productos...');
    await prisma.producto.create({
      data: {
        nombre: 'Soporte para Móvil',
        slug: 'soporte-movil',
        descripcion: 'Soporte ajustable para smartphones, impreso en 3D',
        precio: 15.99,
        stock: 50,
        categoria: 'ACCESORIOS',
        material: 'PLA',
        activo: true,
      },
    });

    await prisma.producto.create({
      data: {
        nombre: 'Maceta Decorativa',
        slug: 'maceta-decorativa',
        descripcion: 'Maceta moderna para plantas pequeñas',
        precio: 12.50,
        stock: 30,
        categoria: 'DECORACION',
        material: 'PLA',
        activo: true,
      },
    });
    console.log('✅ 2 productos creados\n');

    console.log('✅ Seed completado exitosamente!');
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
