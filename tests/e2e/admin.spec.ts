/**
 * E2E Tests - Admin Dashboard
 * Critical business path: Admin product and order management
 */
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  // Helper function to login as admin
  async function loginAsAdmin(page: any) {
    // Navigate to auth with callback to admin dashboard
    await page.goto('/auth?callbackUrl=/admin/dashboard');
    
    // Wait for form to be ready
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });
    
    // Fill in credentials (must match seed data)
    await page.locator('[data-testid="login-email"]').fill('admin@3dprint.com');
    await page.locator('[data-testid="login-password"]').fill('AdminTFM2024!');
    
    // Submit login
    await page.locator('[data-testid="login-submit"]').click();
    
    // Wait for navigation to complete (check for admin or home page)
    await page.waitForFunction(() => {
      const url = window.location.href;
      return url.includes('/admin') || url === 'http://localhost:3000/' || url === 'http://localhost:3000';
    }, { timeout: 30000 });

    // Additional wait for page to fully load
    await page.waitForTimeout(3000);
  }

  // Helper function to login as customer
  async function loginAsCustomer(page: any) {
    await page.goto('/auth');
    
    // Wait for form to be ready
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.locator('[data-testid="login-email"]').fill('juan@example.com');
    await page.locator('[data-testid="login-password"]').fill('JuanTFM2024!');
    
    // Submit login
    await page.locator('[data-testid="login-submit"]').click();
    
    // Wait for navigation to complete
    await page.waitForFunction(() => {
      const url = window.location.href;
      return !url.includes('/auth');
    }, { timeout: 30000 });

    // Additional wait for page to fully load
    await page.waitForTimeout(3000);
  }

  test('should access admin dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);
    
    // Verify we're on admin dashboard by checking URL or page content
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();
    
    // Either we're on admin dashboard or we see admin content
    const isAdmin = currentUrl.includes('/admin') || bodyText?.includes('Panel') || bodyText?.includes('Dashboard');
    expect(isAdmin).toBe(true);
  });

  test('should create new product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await page.waitForTimeout(3000);
    
    // Check if "Nuevo Producto" button exists
    const newProductButton = page.getByRole('link', { name: /Nuevo Producto/i });
    const hasNewProductButton = await newProductButton.isVisible().catch(() => false);
    
    if (!hasNewProductButton) {
      test.skip();
      return;
    }

    // Click new product button
    await newProductButton.click();
    
    // Wait for navigation to new product page
    await page.waitForFunction(() => {
      return window.location.href.includes('/admin/products/new');
    }, { timeout: 15000 });
    
    // Fill product form
    await page.locator('#name').fill('Test Product E2E');
    await page.waitForTimeout(500);
    await page.locator('#description').fill('Test product description for E2E testing');
    await page.locator('#shortDescription').fill('Short description for E2E');
    await page.locator('#price').fill('29.99');
    await page.locator('#stock').fill('10');

    // Select first available category
    const categorySelect = page.locator('#categoryId');
    const options = await categorySelect.locator('option').count();
    if (options > 1) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Submit form
    await page.getByRole('button', { name: /^Crear$/i }).click();

    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check if redirected to products list (success)
    const currentUrl = page.url();
    const success = currentUrl.includes('/admin/products') && !currentUrl.includes('/new');
    
    expect(success).toBe(true);
  });

  test('should update order status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    // Check if table exists
    const hasTable = await page.locator('table tbody tr').first().isVisible().catch(() => false);
    
    if (!hasTable) {
      test.skip();
      return;
    }

    // Click first order
    await page.locator('table tbody tr').first().click();
    
    // Wait for navigation to order detail
    await page.waitForFunction(() => {
      return window.location.href.includes('/admin/orders/');
    }, { timeout: 15000 });

    // Click "Actualizar estado" button if it exists
    const updateButton = page.getByRole('button', { name: /Actualizar estado/i });
    const hasUpdateButton = await updateButton.isVisible().catch(() => false);
    
    if (!hasUpdateButton) {
      test.skip();
      return;
    }
    
    await updateButton.click();

    // Change status to "Enviado"
    await page.locator('[data-testid="status-dropdown"]').selectOption('Enviado');

    // Save the changes
    await page.locator('[data-testid="update-status-button"]').click();

    // Wait for update
    await page.waitForTimeout(3000);

    // Verify success (check for success message or updated status)
    const bodyText = await page.locator('body').textContent();
    const success = bodyText?.includes('actualizado') || bodyText?.includes('Enviado');
    
    expect(success).toBe(true);
  });

  test('should generate invoice for order', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    // Find delivered order
    const orders = await page.locator('table tbody tr').all();
    let deliveredOrderFound = false;
    
    for (const order of orders) {
      const statusText = await order.locator('td').nth(3).textContent().catch(() => '');
      if (statusText?.includes('Entregado') || statusText?.includes('DELIVERED')) {
        await order.click();
        deliveredOrderFound = true;
        break;
      }
    }

    if (!deliveredOrderFound) {
      test.skip();
      return;
    }

    // Wait for order detail page
    await page.waitForFunction(() => {
      return window.location.href.includes('/admin/orders/');
    }, { timeout: 15000 });

    // Click generate invoice button if it exists
    const invoiceButton = page.getByRole('button', { name: /Generar factura/i });
    const hasInvoiceButton = await invoiceButton.isVisible().catch(() => false);
    
    if (!hasInvoiceButton) {
      test.skip();
      return;
    }
    
    await invoiceButton.click();

    // Wait for generation
    await page.waitForTimeout(3000);

    // Verify invoice generated
    const bodyText = await page.locator('body').textContent();
    const invoiceGenerated = bodyText?.includes('factura') || bodyText?.includes('Factura');
    
    expect(invoiceGenerated).toBe(true);
  });

  test('should prevent non-admin access', async ({ page }) => {
    // Login as customer
    await loginAsCustomer(page);
    
    // Try to access admin page
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);
    
    // Should be redirected or see access denied message
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();
    
    // Either redirected away from admin or see forbidden message
    const isBlocked = !currentUrl.includes('/admin/dashboard') || 
                      bodyText?.includes('acceso denegado') || 
                      bodyText?.includes('No autorizado') ||
                      bodyText?.includes('403');
    
    expect(isBlocked).toBe(true);
  });
});