import { prisma } from '@/lib/db/prisma';

async function testDestacados() {
  console.log('🔍 Verificando productos destacados...\n');

  // Obtener productos activos
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: {
      imagenes: {
        where: { esPrincipal: true },
        take: 1,
      },
    },
  });

  console.log(`✅ Productos activos: ${productos.length}`);

  // Obtener pedidos entregados
  const pedidosEntregados = await prisma.pedido.findMany({
    where: { estado: 'ENTREGADO' },
    include: { items: true },
  });

  console.log(`✅ Pedidos entregados: ${pedidosEntregados.length}`);

  // Calcular ventas por producto
  const ventasPorProducto: Record<string, number> = {};
  for (const pedido of pedidosEntregados) {
    for (const item of pedido.items) {
      if (item.productoId) {
        ventasPorProducto[item.productoId] = (ventasPorProducto[item.productoId] || 0) + item.cantidad;
      }
    }
  }

  console.log(`\n📊 Ventas por producto:`);
  Object.entries(ventasPorProducto).forEach(([id, ventas]) => {
    const producto = productos.find(p => p.id === id);
    console.log(`   - ${producto?.nombre}: ${ventas} unidades`);
  });

  // Obtener top 3
  const productosConVentas = productos
    .map((producto) => ({
      ...producto,
      ventas: ventasPorProducto[producto.id] || 0,
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 3);

  console.log(`\n🏆 Top 3 productos más vendidos:`);
  productosConVentas.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nombre} - ${p.ventas} ventas`);
  });

  await prisma.$disconnect();
}

testDestacados().catch(console.error);
