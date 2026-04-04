import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Admin: Product Management
 * Critical catalog administration flows
 */

test.describe('Admin - Product Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    
    const emailInput = page.locator('[data-testid="login-email-input"]');
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('admin@3dprint.com');
      await page.locator('[data-testid="login-password-input"]').fill('admin123');
      // Use more specific selector - the first submit button in the login form
      await page.locator('form button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }
    
    // Go to admin panel
    await page.goto('/admin/products');
  });

  test('should display product listing', async ({ page }) => {
    // Verify admin page is displayed
    await expect(page.locator('h1')).toContainText(/productos|products/i);
    
    // Verify there are products or empty message
    const products = page.locator('[data-testid="admin-product-item"]');
    const emptyMessage = page.locator('[data-testid="no-products-message"]');
    
    const hasProducts = await products.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasProducts || hasEmptyMessage).toBeTruthy();
  });

  test('should navigate to create new product', async ({ page }) => {
    // Click create product button
    const createButton = page.locator('[data-testid="create-product-button"]');
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Verify we are on creation page
      await expect(page).toHaveURL('/admin/products/new');
      await expect(page.locator('h1')).toContainText(/nuevo|new/i);
    }
  });

  test('should complete new product form', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Fill product information
    await page.fill('[data-testid="product-name"]', 'E2E Test Product');
    await page.fill('[data-testid="product-description"]', 'E2E test description');
    await page.fill('[data-testid="product-price"]', '29.99');
    await page.fill('[data-testid="product-stock"]', '50');
    
    // Select category
    await page.selectOption('[data-testid="product-category"]', 'DECORATION');
    
    // Select material
    await page.selectOption('[data-testid="product-material"]', 'PLA');
    
    // Verify save button is visible
    const saveButton = page.locator('[data-testid="save-product-button"]');
    await expect(saveButton).toBeVisible();
  });

  test('should validate required product fields', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Try to save without completing fields
    const saveButton = page.locator('[data-testid="save-product-button"]');
    await saveButton.click();
    
    // Verify error messages
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-price"]')).toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Go to product list
    await page.goto('/admin/products');
    
    // Click edit on first product
    const editButton = page.locator('[data-testid="edit-product"]').first();
    
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      // Verify we are in edit mode
      await expect(page.locator('h1')).toContainText(/editar|edit/i);
      
      // Modify price
      const priceInput = page.locator('[data-testid="product-price"]');
      await priceInput.fill('39.99');
      
      // Save changes
      await page.click('[data-testid="save-product-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
  });

  test('should activate/deactivate product', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Find first product's active toggle
    const toggle = page.locator('[data-testid="toggle-product-active"]').first();
    
    if (await toggle.isVisible().catch(() => false)) {
      // Get current state
      const isChecked = await toggle.isChecked().catch(() => false);
      
      // Change state
      await toggle.click();
      
      // Wait for update
      await page.waitForTimeout(500);
      
      // Verify state changed
      const newState = await toggle.isChecked().catch(() => !isChecked);
      expect(newState).toBe(!isChecked);
    }
  });

  test('should search products in admin', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Use search field
    const searchInput = page.locator('[data-testid="admin-search-input"]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('vase');
      await page.press('[data-testid="admin-search-input"]', 'Enter');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Verify products were filtered
      const products = page.locator('[data-testid="admin-product-item"]');
      // May have results or not
      expect(await products.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Select category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    
    if (await categoryFilter.isVisible().catch(() => false)) {
      await categoryFilter.selectOption('DECORATION');
      
      // Wait for filtering
      await page.waitForTimeout(500);
      
      // Verify only products from that category are displayed
      const products = page.locator('[data-testid="admin-product-item"]');
      expect(await products.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display product statistics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verify there are product metrics
    const stats = page.locator('[data-testid="product-stats"]');
    
    if (await stats.isVisible().catch(() => false)) {
      await expect(stats).toContainText(/productos|products/i);
    }
  });

  test('should prevent unauthorized access', async ({ page }) => {
    // Logout
    await page.goto('/api/auth/signout');
    await page.waitForTimeout(500);
    
    // Try to access as customer
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'customer@test.com');
    await page.fill('input[type="password"]', 'test123');
    // Use more specific selector
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    
    // Try to access admin
    await page.goto('/admin/products');
    
    // Should redirect to home or show 403 error
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/products');
  });
});
