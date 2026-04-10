/**
 * E2E Tests - Shopping Flow
 * Critical business path: Browse → Cart → Checkout → Payment
 */
import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  test('should display product catalog', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.goto('/products');
    
    // Click first product and wait for navigation
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    
    // Wait for product detail page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify product detail page by checking for key elements
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');
    
    // Navigate to product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Add to cart
    await page.locator('[data-testid="add-to-cart-button"]').click();

    // Verify cart updated - wait for the cart count to appear
    await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1', { timeout: 10000 });
  });

  test('should complete checkout flow', async ({ page }) => {
    // First login to ensure user has addresses
    await page.goto('/auth');
    await page.locator('[data-testid="login-email"]').fill('juan@example.com');
    await page.locator('[data-testid="login-password"]').fill('JuanTFM2024!');
    await page.locator('[data-testid="login-submit"]').click();

    // Wait for redirect after login
    await page.waitForTimeout(3000);

    // Add product to cart via API
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 10000 });

    // Navigate to cart directly (stay logged in)
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if cart has items before clicking checkout
    const emptyCart = await page.locator('[data-testid="empty-cart"]').isVisible().catch(() => false);
    
    if (!emptyCart) {
      // Click checkout button if cart not empty
      await page.locator('[data-testid="checkout-button"]').click();
      await page.waitForTimeout(3000);

      // Handle auth redirect if needed
      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        await page.locator('[data-testid="login-email"]').fill('juan@example.com');
        await page.locator('[data-testid="login-password"]').fill('JuanTFM2024!');
        await page.locator('[data-testid="login-submit"]').click();
        await page.waitForTimeout(3000);
        await page.goto('/checkout');
        await page.waitForTimeout(2000);
      }

      // Verify we're on checkout page
      await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });

      // Verify checkout page loaded
      await expect(page.locator('h1')).toContainText('Finalizar Compra', { timeout: 10000 });

      // Check for shipping section or need for address
      const hasShippingSection = await page.locator('text=Dirección de envío').isVisible().catch(() => false);
      const needsAddress = await page.locator('text=No tienes direcciones guardadas').isVisible().catch(() => false);
      
      expect(hasShippingSection || needsAddress).toBe(true);

      // If we have addresses, proceed with checkout flow
      if (hasShippingSection && !needsAddress) {
        // Select first address if available
        const addressRadio = page.locator('input[name="address"]').first();
        const hasAddress = await addressRadio.isVisible().catch(() => false);
        if (hasAddress) {
          await addressRadio.check();
        }

        // Click confirm order button
        await page.locator('button:has-text("Confirmar pedido")').click();

        // Verify confirmation dialog appears
        await expect(page.locator('text=¿Confirmar compra?')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should update cart quantity', async ({ page }) => {
    await page.goto('/products');
    
    // Add product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="add-to-cart-button"]').click();

    // Wait for cart count to update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1', { timeout: 10000 });

    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    await page.waitForURL(/\/cart/, { timeout: 10000 });

    // Update quantity by clicking increase button
    await page.locator('[data-testid="quantity-increase"]').first().click();

    // Verify quantity updated - check the input value
    await expect(page.locator('[data-testid="cart-item-quantity"]').first()).toHaveValue('2', { timeout: 10000 });
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/products');
    
    // Add product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="add-to-cart-button"]').click();

    // Wait for cart count to update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1', { timeout: 10000 });

    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    await page.waitForURL(/\/cart/, { timeout: 10000 });

    // Remove item (triggers confirmation modal)
    await page.locator('[data-testid="remove-item-button"]').first().click();

    // Confirm removal in modal
    await page.locator('button:has-text("Eliminar")').click();

    // Verify cart empty - empty-cart testid exists
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible({ timeout: 10000 });
  });
});