#!/usr/bin/env tsx
/**
 * Complete Database Reset and Seed Script
 *
 * This script:
 * 1. Truncates ALL tables in dependency order
 * 2. Resets sequences
 * 3. Seeds fresh data from CSV files
 *
 * ⚠️  WARNING: This will DELETE all existing data permanently!
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Tables in dependency order (respects foreign key constraints)
const TABLES_IN_DEPENDENCY_ORDER = [
  'audit_logs',
  'verification_tokens',
  'sessions',
  'order_messages',
  'alerts',
  'inventory_movements',
  'payments',
  'order_items',
  'cart_items',
  'carts',
  'orders',
  'invoices',
  'product_images',
  'reviews',
  'products',
  'categories',
  'addresses',
  'coupons',
  'users',
];

async function truncateAllTables(): Promise<void> {
  console.log('🧹 Truncating all tables...');

  // Disable foreign key checks temporarily
  await prisma.$executeRaw`SET session_replication_role = 'replica'`;

  for (const table of TABLES_IN_DEPENDENCY_ORDER) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      console.log(`  ✅ ${table} truncated`);
    } catch (error) {
      console.warn(`  ⚠️  ${table} (may not exist): ${(error as Error).message}`);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRaw`SET session_replication_role = 'origin'`;

  console.log('✅ All tables truncated successfully\n');
}

async function verifyCleanup(): Promise<void> {
  console.log('🔍 Verifying cleanup...');

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
  ]);

  const totalRecords = counts.reduce((a: number, b: number) => a + b, 0);

  if (totalRecords === 0) {
    console.log('✅ Database is clean (0 records)\n');
  } else {
    console.warn(`⚠️  Database still has ${totalRecords} records\n`);
  }
}

async function runSeed(): Promise<void> {
  console.log('🌱 Running database seed...\n');

  try {
    // The seed.ts script will populate the database
    execSync('tsx prisma/seed.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('\n' + '═'.repeat(80));
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '⚠️  COMPLETE DATABASE RESET'.padStart(52).padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║  This will:'.padEnd(78) + '║');
  console.log('║    1. DELETE ALL existing data from ALL tables'.padEnd(78) + '║');
  console.log('║    2. Reset all auto-increment sequences'.padEnd(78) + '║');
  console.log('║    3. Populate with fresh seed data'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║  Tables affected:'.padEnd(78) + '║');
  console.log(`║    ${TABLES_IN_DEPENDENCY_ORDER.join(', ')}`.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('═'.repeat(80) + '\n');

  const answer = await new Promise<string>(resolve => {
    rl.question('Type "RESET" to confirm and proceed: ', ans => {
      resolve(ans.trim());
    });
  });

  if (answer !== 'RESET') {
    console.log('\n❌ Operation cancelled. No changes were made.\n');
    process.exit(0);
  }

  console.log('\n🚀 Starting reset process...\n');

  try {
    // Step 1: Truncate all tables
    await truncateAllTables();

    // Step 2: Verify cleanup
    await verifyCleanup();

    // Step 3: Run seed
    await runSeed();

    console.log('\n' + '═'.repeat(80));
    console.log('║' + '✅ DATABASE RESET COMPLETE'.padStart(52).padEnd(78) + '║');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
