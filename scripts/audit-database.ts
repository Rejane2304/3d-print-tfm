/**
 * Database Audit Script
 * Identifica registros históricos inconsistentes para limpieza manual
 * Ejecutar: npx tsx scripts/audit-database.ts
 */
import { OrderStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Issue {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  count: number;
  details?: string;
  sql?: string;
}

// Funciones auxiliares simples
function generateInClause(ids: string[]): string {
  return ids.map(id => `'${id}'`).join(',');
}

function truncateDetails(details: string, maxLength: number): string {
  if (details.length <= maxLength) {
    return details;
  }
  return details.substring(0, maxLength) + '...';
}

// Checker 1: Pedidos cancelados con facturas activas
async function checkCancelledOrders(): Promise<Issue | null> {
  const orders = await prisma.order.findMany({
    where: {
      status: 'CANCELLED' as OrderStatus,
      invoice: { isCancelled: false },
    },
    select: {
      id: true,
      orderNumber: true,
      invoice: { select: { invoiceNumber: true } },
    },
  });

  if (orders.length === 0) {
    return null;
  }

  const orderIds = orders.map(o => o.id);
  const details = orders.map(o =>
    `${o.orderNumber} -> Factura ${o.invoice?.invoiceNumber || 'N/A'}`
  ).join(', ');

  return {
    category: 'Pedidos Cancelados',
    severity: 'CRITICAL',
    description: 'Pedidos CANCELLED con facturas no anuladas',
    count: orders.length,
    details,
    sql: `UPDATE invoices SET is_cancelled = true WHERE order_id IN (${generateInClause(orderIds)});`,
  };
}

// Checker 2: Pagos duplicados
async function checkDuplicatePayments(): Promise<Issue | null> {
  const payments = await prisma.payment.findMany({
    select: { orderId: true },
  });

  const counts = new Map<string, number>();
  payments.forEach(p => {
    counts.set(p.orderId, (counts.get(p.orderId) || 0) + 1);
  });

  const duplicates = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([orderId, count]) => ({ orderId, count }));

  if (duplicates.length === 0) {
    return null;
  }

  const orderIds = duplicates.map(d => d.orderId);
  const details = duplicates.map(d => `Order ${d.orderId}: ${d.count} pagos`).join(', ');

  return {
    category: 'Pagos Duplicados',
    severity: 'CRITICAL',
    description: 'Pedidos con múltiples registros de pago',
    count: duplicates.length,
    details,
    sql: `-- Revisar: SELECT * FROM payments WHERE order_id IN (${generateInClause(orderIds)});`,
  };
}

// Checker 3: Pedidos PENDING antiguos
async function checkOldPending(): Promise<Issue | null> {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING' as OrderStatus,
      createdAt: { lt: new Date(Date.now() - ONE_DAY) },
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
    },
  });

  if (orders.length === 0) {
    return null;
  }

  const orderIds = orders.map(o => o.id);
  const details = orders.map(o => {
    const date = o.createdAt.toISOString().split('T')[0];
    return `${o.orderNumber} (${date})`;
  }).join(', ');

  return {
    category: 'Pedidos Huérfanos',
    severity: 'HIGH',
    description: 'Pedidos PENDING con más de 24 horas',
    count: orders.length,
    details,
    sql:
      '-- Cancelar: UPDATE orders SET status=\'CANCELLED\',cancelled_at=NOW()' +
      ` WHERE id IN (${generateInClause(orderIds)});`,
  };
}

// Checker 4: Stock negativo
async function checkNegativeStock(): Promise<Issue | null> {
  const products = await prisma.product.findMany({
    where: { stock: { lt: 0 } },
    select: { id: true, name: true, stock: true },
  });

  if (products.length === 0) {
    return null;
  }

  const productIds = products.map(p => p.id);
  const details = products.map(p => `${p.name}: ${p.stock}`).join(', ');

  return {
    category: 'Stock Negativo',
    severity: 'CRITICAL',
    description: 'Productos con stock negativo',
    count: products.length,
    details,
    sql: `UPDATE products SET stock=0 WHERE id IN (${generateInClause(productIds)});`,
  };
}

// Checker 5: Discrepancias de stock
async function checkStockMismatch(): Promise<Issue | null> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, stock: true },
    take: 100,
  });

  const mismatches = [];

  for (const product of products) {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId: product.id },
    });

    if (movements.length === 0) {
      continue;
    }

    let calculated = 0;
    for (const m of movements) {
      if (m.type === 'IN') {
        calculated += m.quantity;
      } else if (m.type === 'OUT') {
        calculated -= m.quantity;
      } else if (m.type === 'ADJUSTMENT') {
        calculated = m.newStock;
      }
    }

    if (calculated !== product.stock) {
      mismatches.push({ name: product.name, current: product.stock, calculated });
    }
  }

  if (mismatches.length === 0) {
    return null;
  }
  if (mismatches.length === 0) {
    return null;
  }
  const details = mismatches
    .slice(0, 5)
    .map(m => `${m.name}: ${m.current} vs ${m.calculated}`)
    .join(', ');

  const suffix = mismatches.length > 5 ? '...' : '';

  return {
    category: 'Inconsistencia Stock',
    severity: 'HIGH',
    description: 'Stock actual no coincide con movimientos',
    count: mismatches.length,
    details: details + suffix,
  };
}

// Checker 6: Pedidos vacíos
async function checkEmptyOrders(): Promise<Issue | null> {
  const orders = await prisma.order.findMany({
    where: { items: { none: {} } },
    select: { id: true, orderNumber: true },
  });

  if (orders.length === 0) {
    return null;
  }

  return {
    category: 'Pedidos Vacíos',
    severity: 'HIGH',
    description: 'Pedidos sin items',
    count: orders.length,
    details: orders.map(o => o.orderNumber).join(', '),
  };
}

// Checker 7: Facturas huérfanas
async function checkOrphanedInvoices(): Promise<Issue | null> {
  const invoices = await prisma.invoice.findMany({
    select: { id: true, invoiceNumber: true, orderId: true },
  });

  const orphaned = invoices.filter(inv => !inv.orderId);

  if (orphaned.length === 0) {
    return null;
  }

  return {
    category: 'Facturas Huérfanas',
    severity: 'MEDIUM',
    description: 'Facturas sin pedido asociado',
    count: orphaned.length,
  };
}

// Checker 8: Cupones
async function checkCoupons(): Promise<Issue | null> {
  const coupons = await prisma.coupon.findMany({
    where: { usedCount: { gt: 0 } },
    select: { id: true, code: true, usedCount: true },
  });

  if (coupons.length === 0) {
    return null;
  }

  return {
    category: 'Cupones',
    severity: 'MEDIUM',
    description: 'Cupones con usos registrados (verificar manualmente)',
    count: coupons.length,
    details: 'Revisar en panel de admin que los usos coincidan',
  };
}

// Ejecutar un checker e imprimir resultado
async function runChecker(name: string, checker: () => Promise<Issue | null>): Promise<Issue | null> {
  console.log(`\n📋 ${name}`);
  const result = await checker();
  console.log(`   ${result?.count || 0} encontrados`);
  return result;
}

// Imprimir reporte
function printReport(issues: Issue[]) {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 RESUMEN DE INCONSISTENCIAS');
  console.log('='.repeat(80));

  const critical = issues.filter(i => i.severity === 'CRITICAL').length;
  const high = issues.filter(i => i.severity === 'HIGH').length;
  const medium = issues.filter(i => i.severity === 'MEDIUM').length;

  console.log(`\n🔴 CRÍTICAS: ${critical}`);
  console.log(`🟠 ALTAS: ${high}`);
  console.log(`🟡 MEDIAS: ${medium}`);
  console.log(`\n📈 TOTAL: ${issues.length} tipos`);

  if (issues.length === 0) {
    console.log('\n✅ Base de datos limpia');
    return;
  }

  console.log('\n📝 DETALLES:');
  console.log('='.repeat(80));

  for (const issue of issues) {
    console.log(`\n[${issue.severity}] ${issue.category}`);
    console.log(`   ${issue.description}`);
    console.log(`   Cantidad: ${issue.count}`);
    if (issue.details) {
      console.log(`   Detalles: ${truncateDetails(issue.details, 200)}`);
    }
    if (issue.sql) {
      console.log(`   SQL: ${issue.sql}`);
    }
  }
}

// Función principal - orquesta los checkers
async function auditDatabase() {
  console.log('🔍 INICIANDO AUDITORÍA\n');
  console.log('='.repeat(80));

  const issues: Issue[] = [];

  // Ejecutar todos los checkers secuencialmente
  const results = await Promise.all([
    runChecker('1. Pedidos cancelados con facturas', checkCancelledOrders),
    runChecker('2. Pagos duplicados', checkDuplicatePayments),
    runChecker('3. Pedidos PENDING antiguos', checkOldPending),
    runChecker('4. Stock negativo', checkNegativeStock),
    runChecker('5. Discrepancias de stock', checkStockMismatch),
    runChecker('6. Pedidos sin items', checkEmptyOrders),
    runChecker('7. Facturas huérfanas', checkOrphanedInvoices),
    runChecker('8. Cupones', checkCoupons),
  ]);

  // Filtrar resultados nulos
  for (const result of results) {
    if (result) {
      issues.push(result);
    }
  }

  printReport(issues);

  await prisma.$disconnect();
}

auditDatabase().catch(async(error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
