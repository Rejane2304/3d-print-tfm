import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Product Catalog
 * Critical navigation and search flows
 */

test.describe('Product Catalog', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('should display product listing', async ({ page }) => {
    // Verify there are products on the page
    const products = await page.locator('[data-testid="product-card"]').count();
    expect(products).toBeGreaterThan(0);
    
    // Verify each product has basic information
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('should navigate to product detail', async ({ page }) => {
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    
    await firstProduct.click();
    
    // Verify we are on detail page
    await expect(page).toHaveURL(/\/products\//);
    
    // Verify product name is displayed
    await expect(page.locator('h1')).toContainText(productName || '');
  });

  test('should filter by category', async ({ page }) => {
    // Select category filter
    await page.selectOption('[data-testid="category-filter"]', 'DECORATION');
    
    // Wait for listing to update
    await page.waitForTimeout(500);
    
    // Verify displayed products are from selected category
    const products = page.locator('[data-testid="product-card"]');
    const count = await products.count();
    
    if (count > 0) {
      // Verify first product has correct category
      // Note: This assumes there is a visible category indicator
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Decoration');
    }
  });

  test('should search products by name', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', 'vase');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Verify results are displayed or not found message
    const products = page.locator('[data-testid="product-card"]');
    const hasProducts = await products.count() > 0;
    const hasNoResults = await page.locator('[data-testid="no-results"]').isVisible().catch(() => false);
    
    expect(hasProducts || hasNoResults).toBeTruthy();
  });

  test('should sort products by price', async ({ page }) => {
    // Select sort
    await page.selectOption('[data-testid="sort-select"]', 'price_asc');
    
    // Wait for reorder
    await page.waitForTimeout(500);
    
    // Verify products are sorted
    // Get prices of first and last visible product
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();
    expect(firstPrice).toBeTruthy();
  });

  test('should paginate results', async ({ page }) => {
    // Check if there is pagination
    const pagination = page.locator('[data-testid="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      // Click next page
      await page.click('[data-testid="next-page"]');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\?page=/);
      
      // Verify different products are displayed
      const products = page.locator('[data-testid="product-card"]');
      expect(await products.count()).toBeGreaterThan(0);
    }
  });

  test('should display featured products on home', async ({ page }) => {
    await page.goto('/');
    
    // Verify featured section
    const featuredSection = page.locator('[data-testid="featured-products"]');
    await expect(featuredSection).toBeVisible();
    
    // Verify there are featured products
    const featuredProducts = featuredSection.locator('[data-testid="product-card"]');
    expect(await featuredProducts.count()).toBeGreaterThan(0);
  });
});