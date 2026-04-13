#!/usr/bin/env node
/**
 * Script para corregir cálculos matemáticos en CSV de orders e invoices
 * Fórmula correcta: Total = (Subtotal - Discount) × 1.21 + Shipping
 * IVA solo sobre productos, envío sin IVA
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
      obj[header.trim()] = values[i] === undefined ? '' : values[i].trim();
    });
    return obj;
  });
  return { headers, rows };
}

// Escribir CSV
function writeCSV(filename, headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach(row => {
    const values = headers.map(h => row[h] || '');
    lines.push(values.join(','));
  });
  fs.writeFileSync(path.join(DATA_DIR, filename), lines.join('\n') + '\n');
}

// Redondear a 2 decimales
function round2(num) {
  return Math.round(num * 100) / 100;
}

console.log('🔧 Corrigiendo cálculos en CSV...\n');

// ============================================
// CORREGIR ORDERS.CSV
// ============================================
console.log('📄 Procesando orders.csv...');
const orders = readCSV('orders.csv');

orders.rows = orders.rows.map(row => {
  const subtotal = Number.parseFloat(row.subtotal) || 0;
  const shipping = Number.parseFloat(row.shipping) || 0;
  const discount = Number.parseFloat(row.discount) || 0;

  // FÓRMULA CORRECTA: (subtotal - discount) × 1.21 + shipping
  const total = round2((subtotal - discount) * 1.21 + shipping);

  const oldTotal = Number.parseFloat(row.total);
  if (Math.abs(oldTotal - total) > 0.01) {
    console.log(
      `  📝 ${row._ref}: ${oldTotal} → ${total} ` +
        `(subtotal: ${subtotal}, shipping: ${shipping}, discount: ${discount})`,
    );
  }

  row.total = total.toFixed(2);
  return row;
});

writeCSV('orders.csv', orders.headers, orders.rows);
console.log('✅ orders.csv corregido\n');

// ============================================
// CORREGIR INVOICES.CSV
// ============================================
console.log('📄 Procesando invoices.csv...');
const invoices = readCSV('invoices.csv');

invoices.rows = invoices.rows.map(row => {
  const subtotal = Number.parseFloat(row.subtotal) || 0;
  const shipping = Number.parseFloat(row.shipping) || 0;
  const discount = Number.parseFloat(row.discount) || 0;

  // FÓRMULA CORRECTA:
  // Base imponible = subtotal - discount (productos sin IVA)
  // IVA = (subtotal - discount) × 0.21
  // Total = (subtotal - discount) × 1.21 + shipping

  const netAmount = subtotal - discount;
  const vatAmount = round2(netAmount * 0.21);
  const total = round2(netAmount * 1.21 + shipping);

  // taxableAmount según Hacienda: base imponible = productos + envío (sin IVA aún)
  const taxableAmount = round2(netAmount + shipping);

  const oldTotal = Number.parseFloat(row.total);
  const oldVat = Number.parseFloat(row.vatAmount);

  if (Math.abs(oldTotal - total) > 0.01 || Math.abs(oldVat - vatAmount) > 0.01) {
    console.log(`  📝 ${row.invoiceNumber}: total ${oldTotal} → ${total}, iva ${oldVat} → ${vatAmount}`);
  }

  row.taxableAmount = taxableAmount.toFixed(2);
  row.vatAmount = vatAmount.toFixed(2);
  row.total = total.toFixed(2);
  row.vatRate = '21.00';

  return row;
});

writeCSV('invoices.csv', invoices.headers, invoices.rows);
console.log('✅ invoices.csv corregido\n');

console.log('🎉 ¡Todos los CSV han sido corregidos!');
console.log('\nFórmula aplicada:');
console.log('  IVA = (Subtotal - Discount) × 0.21');
console.log('  Total = (Subtotal - Discount) × 1.21 + Shipping');
