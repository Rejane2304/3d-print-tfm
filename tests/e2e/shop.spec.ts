/**
 * E2E Tests - Shopping Flow
 * Critical business path: Browse → Cart → Checkout → Payment
 */
import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display product catalog', async ({ page }) => {
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });

  test('should navigate to product detail', async ({ page }) => {
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Verify product detail page
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Navigate to product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Add to cart
    await page.locator('[data-testid="add-to-cart-button"]').click();
    
    // Verify cart updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('should complete checkout flow', async ({ page }) => {
    // Add product to cart
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('[data-testid="add-to-cart-button"]').click();
    
    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page).toHaveURL(/\/cart/);
    
    // Proceed to checkout
    await page.locator('[data-testid="checkout-button"]').click();
    
    // Login if required
    if (await page.locator('[data-testid="login-form"]').isVisible()) {
      await page.locator('[data-testid="login-email"]').fill('admin@test.com');
      await page.locator('[data-testid="login-password"]').fill('test123');
      await page.locator('[data-testid="login-submit"]').click();
    }
    
    // Fill shipping form
    await page.locator('[data-testid="shipping-name"]').fill('Test User');
    await page.locator('[data-testid="shipping-address"]').fill('Test Street 123');
    await page.locator('[data-testid="shipping-city"]').fill('Madrid');
    await page.locator('[data-testid="shipping-postal-code"]').fill('28001');
    
    // Complete checkout
    await page.locator('[data-testid="complete-checkout-button"]').click();
    
    // Verify redirect to payment or success
    await expect(page).toHaveURL(/checkout|success/);
  });

  test('should update cart quantity', async ({ page }) => {
    // Add product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('[data-testid="add-to-cart-button"]').click();
    
    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    
    // Update quantity
    await page.locator('[data-testid="quantity-increase"]').click();
    
    // Verify quantity updated
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toContainText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('[data-testid="add-to-cart-button"]').click();
    
    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    
    // Remove item
    await page.locator('[data-testid="remove-item-button"]').click();
    
    // Verify cart empty
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
  });
});
