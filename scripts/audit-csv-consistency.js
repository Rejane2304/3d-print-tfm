#!/usr/bin/env node
/**
 * Auditoría completa de consistencia entre archivos CSV
 * Verifica contabilidad, stock y referencias cruzadas
 */

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(__dirname, '../public/data');

// Leer CSV
function readCSV(filename) {
  const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      if (values[i] === undefined) {
        obj[header.trim()] = '';
      } else {
        obj[header.trim()] = values[i].trim();
      }
    });
    return obj;
  });
  return { headers, rows };
}

console.log('🔍 AUDITORÍA DE CONSISTENCIA CSV\n');
console.log('=' .repeat(60));

const issues = [];

// Cargar todos los CSV
const files = {
  products: readCSV('products.csv'),
  orders: readCSV('orders.csv'),
  orderItems: readCSV('order_items.csv'),
  invoices: readCSV('invoices.csv'),
  users: readCSV('users.csv'),
  addresses: readCSV('addresses.csv'),
  payments: readCSV('payments.csv'),
  coupons: readCSV('coupons.csv'),
  categories: readCSV('categories.csv'),
  inventoryMovements: readCSV('inventory_movements.csv'),
};

// ============================================
// 1. Verificar orders vs order_items (SUBTOTAL)
// ============================================
console.log('\n📋 1. ORDERS vs ORDER_ITEMS (Subtotales)');
console.log('-'.repeat(60));

files.orders.rows.forEach(order => {
  const orderRef = order._ref;
  const items = files.orderItems.rows.filter(item => item._orderRef === orderRef);

  if (items.length === 0) {
    issues.push(`❌ ${orderRef}: No tiene items en order_items.csv`);
    console.log(`❌ ${orderRef}: Sin items`);
    return;
  }

  const calculatedSubtotal = items.reduce((sum, item) => {
    return sum + (Number.parseFloat(item.price) * Number.parseInt(item.quantity));
  }, 0);

  const orderSubtotal = Number.parseFloat(order.subtotal);
  const diff = Math.abs(calculatedSubtotal - orderSubtotal);

  if (diff > 0.01) {
    issues.push(`❌ ${orderRef}: Subtotal incorrecto. CSV=${orderSubtotal}, Calculado=${calculatedSubtotal.toFixed(2)}`);
    console.log(`❌ ${orderRef}: ${orderSubtotal} ≠ ${calculatedSubtotal.toFixed(2)} (diff: ${diff.toFixed(2)})`);
  } else {
    console.log(`✅ ${orderRef}: ${orderSubtotal.toFixed(2)} (${items.length} items)`);
  }
});

// ============================================
// 2. Verificar orders vs invoices (TOTALES)
// ============================================
console.log('\n📋 2. ORDERS vs INVOICES (Totales)');
console.log('-'.repeat(60));

files.invoices.rows.forEach(inv => {
  const orderRef = inv._orderRef;
  const order = files.orders.rows.find(o => o._ref === orderRef);

  if (!order) {
    issues.push(`❌ Invoice ${inv.invoiceNumber}: Referencia a ${orderRef} no existe`);
    console.log(`❌ ${inv.invoiceNumber}: Orden ${orderRef} no existe`);
    return;
  }

  const orderTotal = Number.parseFloat(order.total);
  const invTotal = Number.parseFloat(inv.total);
  const diff = Math.abs(orderTotal - invTotal);

  if (diff > 0.01) {
    issues.push(`❌ ${inv.invoiceNumber}: Total ${invTotal} ≠ Orden ${orderTotal}`);
    console.log(`❌ ${inv.invoiceNumber}: ${invTotal} ≠ ${orderTotal} (orden ${orderRef})`);
  } else {
    console.log(`✅ ${inv.invoiceNumber}: ${invTotal} (orden ${orderRef})`);
  }
});

// ============================================
// 3. Verificar invoices (matemática interna)
// ============================================
console.log('\n📋 3. INVOICES (Matemática interna)');
console.log('-'.repeat(60));

files.invoices.rows.forEach(inv => {
  const subtotal = Number.parseFloat(inv.subtotal);
  const shipping = Number.parseFloat(inv.shipping);
  const discount = Number.parseFloat(inv.discount) || 0;
  const vatRate = Number.parseFloat(inv.vatRate);
  const vatAmount = Number.parseFloat(inv.vatAmount);
  const total = Number.parseFloat(inv.total);
  const taxableAmount = Number.parseFloat(inv.taxableAmount);

  // Fórmula correcta: IVA solo sobre productos
  const expectedVat = (subtotal - discount) * (vatRate / 100);
  const expectedTotal = (subtotal - discount) * (1 + vatRate / 100) + shipping;
  const expectedTaxable = (subtotal - discount) + shipping;

  const vatDiff = Math.abs(vatAmount - expectedVat);
  const totalDiff = Math.abs(total - expectedTotal);
  const taxableDiff = Math.abs(taxableAmount - expectedTaxable);

  const errors = [];
  if (vatDiff > 0.01) {
    errors.push(`IVA: ${vatAmount} ≠ ${expectedVat.toFixed(2)}`);
  }
  if (totalDiff > 0.01) {
    errors.push(`Total: ${total} ≠ ${expectedTotal.toFixed(2)}`);
  }
  if (taxableDiff > 0.01) {
    errors.push(`Base: ${taxableAmount} ≠ ${expectedTaxable.toFixed(2)}`);
  }

  if (errors.length > 0) {
    issues.push(`❌ ${inv.invoiceNumber}: ${errors.join(', ')}`);
    console.log(`❌ ${inv.invoiceNumber}: ${errors.join(', ')}`);
  } else {
    console.log(`✅ ${inv.invoiceNumber}: Matemática correcta`);
  }
});

// ============================================
// 4. Verificar order_items vs products
// ============================================
console.log('\n📋 4. ORDER_ITEMS vs PRODUCTS');
console.log('-'.repeat(60));

const productRefs = new Set(files.products.rows.map(p => p._ref));
let productErrors = 0;

files.orderItems.rows.forEach(item => {
  if (!productRefs.has(item._productRef)) {
    issues.push(`❌ Item ${item._ref}: Producto ${item._productRef} no existe`);
    console.log(`❌ ${item._ref}: Producto ${item._productRef} no existe`);
    productErrors++;
  }

  // Verificar precio
  const product = files.products.rows.find(p => p._ref === item._productRef);
  if (product) {
    const itemPrice = Number.parseFloat(item.price);
    const productPrice = Number.parseFloat(product.price);
    if (Math.abs(itemPrice - productPrice) > 0.01) {
      issues.push(`❌ ${item._ref}: Precio ${itemPrice} ≠ Producto ${productPrice}`);
      console.log(`❌ ${item._ref}: Precio ${itemPrice} ≠ ${productPrice}`);
      productErrors++;
    }
  }
});

if (productErrors === 0) {
  console.log('✅ Todos los items referencian productos válidos');
}

// ============================================
// 5. Verificar stock vs inventory_movements
// ============================================
console.log('\n📋 5. STOCK vs INVENTORY_MOVEMENTS');
console.log('-'.repeat(60));

files.products.rows.forEach(prod => {
  const movements = files.inventoryMovements.rows.filter(m => m._productRef === prod._ref);

  if (movements.length === 0) {
    // Productos sin movimientos pueden tener stock inicial
    console.log(`ℹ️  ${prod._ref}: Sin movimientos (stock: ${prod.stock})`);
    return;
  }

  // Calcular stock basado en movimientos
  let calculatedStock = 0;
  movements.forEach(m => {
    const qty = Number.parseInt(m.quantity);
    if (m.type === 'IN') {
      calculatedStock += qty;
    } else if (m.type === 'OUT') {
      calculatedStock -= qty;
    } else if (m.type === 'ADJUSTMENT') {
      calculatedStock = qty; // Ajuste absoluto
    }
  });

  const currentStock = Number.parseInt(prod.stock);
  const diff = currentStock - calculatedStock;

  if (diff === 0) {
    console.log(`✅ ${prod._ref}: Stock ${currentStock} (${movements.length} movimientos)`);
  } else {
    issues.push(`❌ ${prod._ref}: Stock ${currentStock} ≠ Calculado ${calculatedStock} (diff: ${diff})`);
    console.log(`❌ ${prod._ref}: Stock ${currentStock} ≠ Calculado ${calculatedStock}`);
  }
});

// ============================================
// 6. Verificar users vs orders/addresses
// ============================================
console.log('\n📋 6. USERS vs ORDERS/ADDRESSES');
console.log('-'.repeat(60));

const userRefs = new Set(files.users.rows.map(u => u._ref));
let userErrors = 0;

files.orders.rows.forEach(order => {
  if (!userRefs.has(order._userRef)) {
    issues.push(`❌ Orden ${order._ref}: Usuario ${order._userRef} no existe`);
    console.log(`❌ ${order._ref}: Usuario ${order._userRef} no existe`);
    userErrors++;
  }
});

files.addresses.rows.forEach(addr => {
  if (!userRefs.has(addr._userRef)) {
    issues.push(`❌ Dirección ${addr._ref}: Usuario ${addr._userRef} no existe`);
    console.log(`❌ ${addr._ref}: Usuario ${addr._userRef} no existe`);
    userErrors++;
  }
});

if (userErrors === 0) {
  console.log('✅ Todas las referencias a usuarios son válidas');
}

// ============================================
// 7. Verificar payments vs orders
// ============================================
console.log('\n📋 7. PAYMENTS vs ORDERS');
console.log('-'.repeat(60));

const orderRefs = new Set(files.orders.rows.map(o => o._ref));
let paymentErrors = 0;

files.payments.rows.forEach(pay => {
  if (!orderRefs.has(pay._orderRef)) {
    issues.push(`❌ Payment ${pay._ref}: Orden ${pay._orderRef} no existe`);
    console.log(`❌ ${pay._ref}: Orden ${pay._orderRef} no existe`);
    paymentErrors++;
    return;
  }

  const order = files.orders.rows.find(o => o._ref === pay._orderRef);
  const payAmount = Number.parseFloat(pay.amount);
  const orderTotal = Number.parseFloat(order.total);
  const diff = Math.abs(payAmount - orderTotal);

  if (diff > 0.01) {
    issues.push(`❌ ${pay._ref}: Monto ${payAmount} ≠ Orden ${orderTotal}`);
    console.log(`❌ ${pay._ref}: ${payAmount} ≠ ${orderTotal}`);
    paymentErrors++;
  }
});

if (paymentErrors === 0) {
  console.log('✅ Todos los pagos coinciden con órdenes');
}

// ============================================
// RESUMEN
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE AUDITORÍA');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('\n🎉 ¡TODOS LOS CSV SON CONSISTENTES!');
  console.log('✅ No se encontraron errores');
} else {
  console.log(`\n⚠️  Se encontraron ${issues.length} inconsistencias:`);
  console.log('\nDetalle:');
  issues.forEach(issue => console.log(`  ${issue}`));
}

console.log('\n' + '='.repeat(60));
process.exit(issues.length > 0 ? 1 : 0);
