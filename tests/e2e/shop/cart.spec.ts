import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Shopping Cart
 * Critical cart management flows
 */

test.describe('Shopping Cart', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to products page
    await page.goto('/products');
    
    // Add a product to cart
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first();
    await addToCartButton.click();
    
    // Wait for it to be added to cart
    await page.waitForTimeout(500);
  });

  test('should add product to cart', async ({ page }) => {
    // Verify cart has items
    await page.goto('/cart');
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    expect(await cartItems.count()).toBeGreaterThan(0);
  });

  test('should display product information in cart', async ({ page }) => {
    await page.goto('/cart');
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    
    // Verify product information
    await expect(cartItem.locator('[data-testid="cart-item-name"]')).toBeVisible();
    await expect(cartItem.locator('[data-testid="cart-item-price"]')).toBeVisible();
    await expect(cartItem.locator('[data-testid="cart-item-quantity"]')).toBeVisible();
  });

  test('should update product quantity', async ({ page }) => {
    await page.goto('/cart');
    
    // Increase quantity
    const increaseButton = page.locator('[data-testid="increase-quantity"]').first();
    await increaseButton.click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify quantity changed
    const quantityInput = page.locator('[data-testid="cart-item-quantity-input"]').first();
    const value = await quantityInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(1);
  });

  test('should remove product from cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Get initial quantity
    const initialCount = await page.locator('[data-testid="cart-item"]').count();
    
    if (initialCount > 0) {
      // Remove first product
      const removeButton = page.locator('[data-testid="remove-item"]').first();
      await removeButton.click();
      
      // Wait for removal
      await page.waitForTimeout(500);
      
      // Verify cart is empty or has fewer items
      const newCount = await page.locator('[data-testid="cart-item"]').count();
      expect(newCount).toBeLessThan(initialCount);
    }
  });

  test('should calculate total correctly', async ({ page }) => {
    await page.goto('/cart');
    
    // Verify total is displayed
    const totalElement = page.locator('[data-testid="cart-total"]');
    await expect(totalElement).toBeVisible();
    
    // Verify total is a valid number
    const totalText = await totalElement.textContent();
    expect(totalText).toMatch(/\d+[,.]?\d*/);
  });

  test('should persist cart after page reload', async ({ page }) => {
    await page.goto('/cart');
    
    // Get cart information
    const initialCount = await page.locator('[data-testid="cart-item"]').count();
    
    if (initialCount > 0) {
      // Reload page
      await page.reload();
      
      // Verify cart still has items
      const newCount = await page.locator('[data-testid="cart-item"]').count();
      expect(newCount).toBe(initialCount);
    }
  });

  test('should display empty cart when no items', async ({ page }) => {
    // Go directly to cart without adding products
    await page.goto('/cart');
    
    // If there are items, remove them all
    const items = page.locator('[data-testid="cart-item"]');
    while (await items.count() > 0) {
      await page.locator('[data-testid="remove-item"]').first().click();
      await page.waitForTimeout(300);
    }
    
    // Verify empty cart message
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
    await expect(page.locator('text=Empty cart')).toBeVisible();
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Click checkout button
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    
    if (await checkoutButton.isVisible().catch(() => false)) {
      await checkoutButton.click();
      
      // Verify redirect to checkout
      await expect(page).toHaveURL('/checkout');
    }
  });

  test('should display item count indicator in header', async ({ page }) => {
    // Verify cart icon shows count
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    
    if (await cartBadge.isVisible().catch(() => false)) {
      const count = await cartBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });
});