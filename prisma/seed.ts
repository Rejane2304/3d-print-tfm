/**
 * SEED - Datos iniciales para 3D Print TFM
 * Todos los datos provienen de /private/data/*.csv
 */
import { PrismaClient, Rol, Categoria, Material, EstadoPedido, MetodoPago, EstadoPago, TipoMovimiento, TipoAlerta, SeveridadAlerta, EstadoAlerta } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// UTILIDADES PARA LEER CSV
// ============================================

function leerCSV(filename: string): string[][] {
  const filePath = path.join(process.cwd(), 'public', 'data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => line.split(',').map(cell => cell.trim()));
}

function mapearCategoria(csv: string): Categoria {
  const map: Record<string, Categoria> = {
    'DECOR': Categoria.DECORACION,
    'ACCESSORY': Categoria.ACCESORIOS,
    'FUNCTIONAL': Categoria.FUNCIONAL,
    'PIECE': Categoria.ARTICULADOS,
    'TOY': Categoria.JUGUETES,
  };
  return map[csv] || Categoria.DECORACION;
}

function mapearMaterial(csv: string): Material {
  const map: Record<string, Material> = {
    'PLA': Material.PLA,
    'PETG': Material.PETG,
  };
  return map[csv] || Material.PLA;
}

function mapearRol(csv: string): Rol {
  return csv === 'admin' ? Rol.ADMIN : Rol.CLIENTE;
}

function mapearEstadoPedido(csv: string): EstadoPedido {
  const map: Record<string, EstadoPedido> = {
    'PENDING': EstadoPedido.PENDIENTE,
    'CONFIRMED': EstadoPedido.CONFIRMADO,
    'SHIPPED': EstadoPedido.ENVIADO,
    'DELIVERED': EstadoPedido.ENTREGADO,
    'CANCELLED': EstadoPedido.CANCELADO,
    'COMPLETED': EstadoPedido.ENTREGADO,
  };
  return map[csv] || EstadoPedido.PENDIENTE;
}

function mapearMetodoPago(csv: string): MetodoPago {
  return csv === 'card' ? MetodoPago.TARJETA : MetodoPago.TARJETA;
}

function mapearTipoMovimiento(csv: string): TipoMovimiento {
  const map: Record<string, TipoMovimiento> = {
    'IN': TipoMovimiento.ENTRADA,
    'OUT': TipoMovimiento.SALIDA,
    'ADJUSTMENT': TipoMovimiento.AJUSTE,
  };
  return map[csv] || TipoMovimiento.AJUSTE;
}

function mapearTipoAlerta(csv: string): TipoAlerta {
  const map: Record<string, TipoAlerta> = {
    'LOW_STOCK': TipoAlerta.STOCK_BAJO,
    'OUT_OF_STOCK': TipoAlerta.SIN_STOCK,
  };
  return map[csv] || TipoAlerta.STOCK_BAJO;
}

function mapearEstadoAlerta(csv: string): EstadoAlerta {
  const map: Record<string, EstadoAlerta> = {
    'READ': EstadoAlerta.RESUELTA,
    'UNREAD': EstadoAlerta.PENDIENTE,
  };
  return map[csv] || EstadoAlerta.PENDIENTE;
}

// ============================================
// FUNCIONES DE SEED
// ============================================

async function seedConfiguracionGlobal() {
  console.log('🌱 Creando configuración global...');
  
  await prisma.configuracion.create({
    data: {
      nombreEmpresa: '3D Print TFM',
      nifEmpresa: 'B12345678',
      direccionEmpresa: 'Calle Ejemplo 123',
      ciudadEmpresa: 'Madrid',
      provinciaEmpresa: 'Madrid',
      codigoPostalEmpresa: '28001',
      telefonoEmpresa: '+34 900 123 456',
      emailEmpresa: 'info@3dprint-tfm.com',
      tipoIvaDefecto: 21,
      umbralStockBajo: 5,
    },
  });
}

async function seedConfiguracionEnvio() {
  console.log('🌱 Creando configuración de envíos...');
  
  await prisma.configuracionEnvio.create({
    data: {
      nombre: 'Envío Estándar',
      descripcion: 'Entrega en 3-5 días laborables',
      precio: 5.00,
      envioGratisDesde: 50.00,
      diasMinimos: 3,
      diasMaximos: 5,
      activo: true,
      esDefecto: true,
      orden: 1,
    },
  });
  
  await prisma.configuracionEnvio.create({
    data: {
      nombre: 'Envío Express',
      descripcion: 'Entrega en 24-48 horas',
      precio: 9.99,
      diasMinimos: 1,
      diasMaximos: 2,
      activo: true,
      esDefecto: false,
      orden: 2,
    },
  });
}

async function seedUsuarios() {
  console.log('🌱 Creando usuarios...');
  
  const usuarios = leerCSV('users.csv');
  const header = usuarios[0];
  const data = usuarios.slice(1);
  
  for (const row of data) {
    const id = row[0];
    const email = row[1];
    const password = row[2];
    const name = row[3];
    const phone = row[4];
    const address = row[5];
    const role = row[6];
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Extraer ciudad y CP de la dirección (formato: "Calle Mayor 15 - 28001 Madrid")
    const addressParts = address.split(' - ');
    const street = addressParts[0] || address;
    let city = 'Madrid';
    let postalCode = '28001';
    
    if (addressParts[1]) {
      const parts = addressParts[1].split(' ');
      postalCode = parts[0] || '28001';
      city = parts.slice(1).join(' ') || 'Madrid';
    }
    
    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        id,
        email,
        password: hashedPassword,
        nombre: name,
        telefono: phone,
        rol: mapearRol(role),
        activo: true,
      },
    });
    
    // Crear dirección principal
    await prisma.direccion.create({
      data: {
        usuarioId: id,
        nombre: 'Principal',
        destinatario: name,
        telefono: phone,
        direccion: street,
        codigoPostal: postalCode,
        ciudad: city,
        provincia: city,
        pais: 'España',
        esPrincipal: true,
      },
    });
    
    console.log(`  ✓ Usuario creado: ${email} (${role})`);
  }
}

async function seedProductos() {
  console.log('🌱 Creando productos...');
  
  const productos = leerCSV('products.csv');
  const data = productos.slice(1);
  
  for (const row of data) {
    const id = row[0];
    const name = row[1];
    const price = parseFloat(row[2]);
    const stock = parseInt(row[3]);
    const category = row[4];
    const material = row[5];
    const description = row[6];
    const image = row[7];
    
    // Crear slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Crear producto
    await prisma.producto.create({
      data: {
        id,
        slug: `${slug}-${id.toLowerCase()}`,
        nombre: name,
        descripcion: description,
        descripcionCorta: description.substring(0, 100),
        precio: price,
        stock,
        stockMinimo: 5,
        categoria: mapearCategoria(category),
        material: mapearMaterial(material),
        activo: true,
        destacado: stock < 10, // Destacar si stock bajo
        imagenes: {
          create: [
            {
              url: image,
              nombreArchivo: `${id.toLowerCase()}.jpg`,
              textoAlt: `Imagen de ${name}`,
              esPrincipal: true,
              orden: 0,
            },
          ],
        },
      },
    });
    
    console.log(`  ✓ Producto creado: ${name}`);
  }
}

async function seedPedidos() {
  console.log('🌱 Creando pedidos...');
  
  const pedidos = leerCSV('orders.csv');
  const data = pedidos.slice(1);
  
  const items = leerCSV('order_items.csv');
  const itemsData = items.slice(1);
  
  for (const row of data) {
    const id = row[0];
    const userId = row[1];
    const total = parseFloat(row[2]);
    const status = row[3];
    const paymentMethod = row[4];
    const shippingAddress = row[5];
    const notes = row[6] || null;
    
    // Extraer dirección
    const addressParts = shippingAddress.split(' - ');
    const street = addressParts[0] || shippingAddress;
    let city = 'Madrid';
    let postalCode = '28001';
    let province = 'Madrid';
    
    if (addressParts[1]) {
      const parts = addressParts[1].split(' ');
      postalCode = parts[0] || '28001';
      const rest = parts.slice(1).join(' ');
      const cityMatch = rest.match(/^\d+\s+(.+)$/);
      if (cityMatch) {
        city = cityMatch[1];
        province = city;
      }
    }
    
    // Buscar usuario para obtener datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { direcciones: { where: { esPrincipal: true } } },
    });
    
    if (!usuario) continue;
    
    const direccion = usuario.direcciones[0];
    
    // Generar número de pedido
    const numeroPedido = id.replace('ORD-', 'P-2024');
    
    // Calcular subtotal y envío
    const envio = total >= 50 ? 0 : 5;
    const subtotal = total - envio;
    
    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        id,
        numeroPedido,
        usuarioId: userId,
        estado: mapearEstadoPedido(status),
        subtotal,
        envio,
        total,
        metodoPago: mapearMetodoPago(paymentMethod),
        nombreEnvio: usuario.nombre,
        telefonoEnvio: usuario.telefono || '+34 600 000 000',
        direccionEnvio: street,
        codigoPostalEnvio: postalCode,
        ciudadEnvio: city,
        provinciaEnvio: province,
        paisEnvio: 'España',
        notasCliente: notes,
        // Fechas según estado
        confirmadoEn: status !== 'PENDING' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        enviadoEn: status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED' ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
        entregadoEn: status === 'DELIVERED' || status === 'COMPLETED' ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
      },
    });
    
    // Crear items del pedido
    const pedidoItems = itemsData.filter(item => item[1] === id);
    for (const item of pedidoItems) {
      const productId = item[2];
      const name = item[3];
      const price = parseFloat(item[4]);
      const quantity = parseInt(item[5]);
      const material = item[6];
      const category = item[7];
      
      // Buscar producto para imagen
      const producto = await prisma.producto.findUnique({
        where: { id: productId },
        include: { imagenes: { where: { esPrincipal: true } } },
      });
      
      await prisma.itemPedido.create({
        data: {
          pedidoId: id,
          productoId: productId || null,
          nombre: name,
          precio: price,
          cantidad: quantity,
          categoria: mapearCategoria(category),
          material: mapearMaterial(material),
          imagenUrl: producto?.imagenes[0]?.url || null,
          subtotal: price * quantity,
        },
      });
    }
    
    // Crear pago si está completado
    if (status === 'COMPLETED' || status === 'CONFIRMED' || status === 'SHIPPED' || status === 'DELIVERED') {
      await prisma.pago.create({
        data: {
          pedidoId: id,
          usuarioId: userId,
          monto: total,
          metodo: MetodoPago.TARJETA,
          estado: EstadoPago.COMPLETADO,
          fechaProcesado: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    
    console.log(`  ✓ Pedido creado: ${numeroPedido} (${status})`);
  }
}

async function seedMovimientosInventario() {
  console.log('🌱 Creando movimientos de inventario...');
  
  const movimientos = leerCSV('inventory_movements.csv');
  const data = movimientos.slice(1);
  
  // Obtener admin para usar como creador
  const admin = await prisma.usuario.findFirst({
    where: { rol: Rol.ADMIN },
  });
  
  for (const row of data) {
    const productoId = row[1];
    const type = row[2];
    const quantity = parseInt(row[3]);
    const reason = row[4];
    
    // Buscar producto para obtener stock actual
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    });
    
    if (!producto) continue;
    
    // Calcular stock anterior/nuevo basado en el tipo
    let stockAnterior = producto.stock;
    let stockNuevo = producto.stock;
    let cantidadReal = quantity;
    
    if (type === 'IN') {
      stockAnterior = producto.stock - quantity;
      stockNuevo = producto.stock;
    } else if (type === 'OUT') {
      stockAnterior = producto.stock + quantity;
      stockNuevo = producto.stock;
      cantidadReal = -quantity;
    } else if (type === 'ADJUSTMENT') {
      // Ajuste es diferente - representa el cambio neto
      stockAnterior = producto.stock - quantity;
      stockNuevo = producto.stock;
    }
    
    await prisma.movimientoInventario.create({
      data: {
        productoId,
        tipo: mapearTipoMovimiento(type),
        cantidad: cantidadReal,
        stockAnterior,
        stockNuevo,
        motivo: reason,
        referencia: reason.includes('Pedido') ? reason.replace('Pedido ', '') : null,
        creadoPor: admin?.id || 'USER-0001',
      },
    });
  }
  
  console.log(`  ✓ ${data.length} movimientos de inventario creados`);
}

async function seedAlertas() {
  console.log('🌱 Creando alertas...');
  
  // Datos de alertas directamente (evitar problemas de parseo CSV con JSON)
  const alertasData = [
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Vaso Decorativo Floral tiene stock bajo (7 unidades)', estado: 'READ', productoId: 'PROD-0001' },
    { tipo: 'OUT_OF_STOCK', titulo: 'Producto agotado', mensaje: 'Vaso Decorativo Floral tiene stock bajo (0 unidades)', estado: 'UNREAD', productoId: 'PROD-0001' },
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Lámpara Luna 3D tiene stock bajo (3 unidades)', estado: 'UNREAD', productoId: 'PROD-0009' },
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Coche Clásico Articulado tiene stock bajo (5 unidades)', estado: 'READ', productoId: 'PROD-0008' },
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Figura Articulada Dinosaurio Rex tiene stock bajo (4 unidades)', estado: 'UNREAD', productoId: 'PROD-0005' },
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Caja Secretera Medieval tiene stock bajo (6 unidades)', estado: 'UNREAD', productoId: 'PROD-0010' },
    { tipo: 'OUT_OF_STOCK', titulo: 'Producto agotado', mensaje: 'Miniatura de Casa tiene stock bajo (0 unidades)', estado: 'UNREAD', productoId: 'PROD-0006' },
    { tipo: 'LOW_STOCK', titulo: 'Stock bajo', mensaje: 'Soporte para Teléfono Ajustable tiene stock bajo (8 unidades)', estado: 'READ', productoId: 'PROD-0004' },
  ];
  
  // Obtener admin para resolver algunas
  const admin = await prisma.usuario.findFirst({
    where: { rol: Rol.ADMIN },
  });
  
  for (const alerta of alertasData) {
    const isResolved = alerta.estado === 'READ';
    
    await prisma.alerta.create({
      data: {
        tipo: mapearTipoAlerta(alerta.tipo),
        severidad: alerta.tipo === 'OUT_OF_STOCK' ? SeveridadAlerta.ALTA : SeveridadAlerta.MEDIA,
        titulo: alerta.titulo,
        mensaje: alerta.mensaje,
        estado: mapearEstadoAlerta(alerta.estado),
        productoId: alerta.productoId || null,
        resueltaEn: isResolved ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
        resueltaPor: isResolved ? admin?.id : null,
      },
    });
  }
  
  console.log(`  ✓ ${alertasData.length} alertas creadas`);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Iniciando seed de 3D Print TFM...\n');
  
  try {
    // Limpiar base de datos
    console.log('🧹 Limpiando base de datos...');
    await prisma.movimientoInventario.deleteMany();
    await prisma.alerta.deleteMany();
    await prisma.itemPedido.deleteMany();
    await prisma.pago.deleteMany();
    await prisma.pedido.deleteMany();
    await prisma.imagenProducto.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.direccion.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.configuracionEnvio.deleteMany();
    await prisma.configuracion.deleteMany();
    console.log('✅ Base de datos limpiada\n');
    
    // Crear datos
    await seedConfiguracionGlobal();
    await seedConfiguracionEnvio();
    await seedUsuarios();
    await seedProductos();
    await seedPedidos();
    await seedMovimientosInventario();
    await seedAlertas();
    
    console.log('\n✅ Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
