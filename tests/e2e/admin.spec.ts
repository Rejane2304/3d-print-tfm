/**
 * E2E Tests - Admin Dashboard
 * Critical business path: Admin product and order management
 */
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.locator('[data-testid="login-email"]').fill('admin@test.com');
    await page.locator('[data-testid="login-password"]').fill('test123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/admin/);
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Click new product button
    await page.locator('[data-testid="new-product-button"]').click();
    
    // Fill product form
    await page.locator('[data-testid="product-name"]').fill('Test Product E2E');
    await page.locator('[data-testid="product-slug"]').fill(`test-product-${Date.now()}`);
    await page.locator('[data-testid="product-price"]').fill('29.99');
    await page.locator('[data-testid="product-stock"]').fill('10');
    await page.locator('[data-testid="product-description"]').fill('Test product description');
    
    // Submit form
    await page.locator('[data-testid="save-product-button"]').click();
    
    // Verify success
    await expect(page.locator('[data-testid="product-saved-message"]')).toBeVisible();
  });

  test('should update order status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Click first order
    await page.locator('[data-testid="order-row"]').first().click();
    
    // Change status
    await page.locator('[data-testid="status-dropdown"]').selectOption('SHIPPED');
    await page.locator('[data-testid="update-status-button"]').click();
    
    // Verify status updated
    await expect(page.locator('[data-testid="status-updated-message"]')).toBeVisible();
  });

  test('should generate invoice for order', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Find delivered order and click
    const orders = await page.locator('[data-testid="order-row"]').all();
    for (const order of orders) {
      const status = await order.locator('[data-testid="order-status"]').textContent();
      if (status === 'DELIVERED') {
        await order.click();
        break;
      }
    }
    
    // Generate invoice
    await page.locator('[data-testid="generate-invoice-button"]').click();
    
    // Verify invoice generated
    await expect(page.locator('[data-testid="invoice-generated-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-invoice-button"]')).toBeVisible();
  });

  test('should prevent non-admin access', async ({ page }) => {
    // Logout
    await page.locator('[data-testid="logout-button"]').click();
    
    // Login as customer
    await page.goto('/auth');
    await page.locator('[data-testid="login-email"]').fill('cliente@test.com');
    await page.locator('[data-testid="login-password"]').fill('test123');
    await page.locator('[data-testid="login-submit"]').click();
    
    // Try to access admin
    await page.goto('/admin/dashboard');
    
    // Should be redirected
    await expect(page).not.toHaveURL('/admin/dashboard');
  });
});
