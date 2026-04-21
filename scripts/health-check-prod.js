#!/usr/bin/env node
/**
 * Health Check Script for Production
 * Tests critical flows without completing actual payments
 *
 * Usage: node scripts/health-check-prod.js [https://your-domain.vercel.app]
 */

const BASE_URL = process.argv[2] || 'https://3d-print-tfm.vercel.app';

const TESTS = {
  // Test 1: API de productos
  products: async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.products?.length) throw new Error('No products returned');
    return `✅ ${data.products.length} products available`;
  },

  // Test 2: API de site-config
  siteConfig: async () => {
    const res = await fetch(`${BASE_URL}/api/site-config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.config?.nombreEmpresa) throw new Error('No config data');
    return `✅ Config loaded: ${data.config.nombreEmpresa}`;
  },

  // Test 3: Página de checkout (verifica que carga)
  checkoutPage: async () => {
    const res = await fetch(`${BASE_URL}/checkout`, {
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('checkout') && !html.includes('Checkout')) {
      throw new Error('Checkout page content missing');
    }
    return '✅ Checkout page loads';
  },

  // Test 4: Verificar stock de productos
  stockCheck: async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    const lowStock = data.products.filter(p => p.stock < 5);
    if (lowStock.length > 0) {
      return `⚠️ ${lowStock.length} products with low stock (< 5)`;
    }
    return '✅ All products have adequate stock';
  },

  // Test 5: Database connectivity (indirecto)
  dbConnectivity: async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/products?limit=1`);
    const duration = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (duration > 5000) throw new Error(`Slow response: ${duration}ms`);
    return `✅ DB response time: ${duration}ms`;
  },
};

async function runTests() {
  console.log(`🔍 Health Check: ${BASE_URL}\n`);

  const results = [];

  for (const [name, test] of Object.entries(TESTS)) {
    try {
      const start = Date.now();
      const result = await test();
      const duration = Date.now() - start;
      console.log(`${result} (${duration}ms)`);
      results.push({ name, status: 'PASS', duration });
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.push({ name, status: 'FAIL', error: error.message });
    }
  }

  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
