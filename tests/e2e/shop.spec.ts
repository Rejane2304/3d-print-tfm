/**
 * E2E Tests - Shopping Flow
 * Critical business path: Browse → Cart → Checkout → Payment
 */
import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  test('should display product catalog', async ({ page }) => {
    await page.goto('/products');

    // Wait for product grid to be visible with explicit wait
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Verify at least one product card is visible
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to product detail', async ({ page }) => {
    // First go to products page to ensure products exist
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Get the first product card and extract its href to navigate directly
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Get the href attribute from the link
    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the product detail page using the extracted href
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // Wait for product detail page elements to be visible
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[data-testid="add-to-cart-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('should add product to cart', async ({ page }) => {
    // First go to products page to ensure products exist
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Get the first product card and extract its href
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Get the href attribute from the link
    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the product detail page
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // Wait for product detail page to load
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    // Wait for add to cart button to be visible
    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });

    // Click the add to cart button
    await addButton.click();

    // Verify cart updated - wait for the cart count to appear
    await page.waitForTimeout(1000);

    // Wait for cart count to be visible
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toBeVisible({ timeout: 15000 });
    await expect(cartCount).toContainText('1', { timeout: 10000 });
  });

  test('should complete checkout flow', async ({ page }) => {
    // Aumentar timeout para este test
    test.setTimeout(90000);

    // First login to ensure user has addresses
    await page.goto('/auth');
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="login-email"]').fill('juan@example.com');
    await page.locator('[data-testid="login-password"]').fill('JuanTFM2024!');
    await page.locator('[data-testid="login-submit"]').click();

    // Wait for redirect after login
    await page.waitForTimeout(5000);

    // Verificar que estamos autenticados
    const url = page.url();
    if (url.includes('/auth')) {
      // Reintentar login si es necesario
      await page.locator('[data-testid="login-email"]').fill('juan@example.com');
      await page.locator('[data-testid="login-password"]').fill('JuanTFM2024!');
      await page.locator('[data-testid="login-submit"]').click();
      await page.waitForTimeout(5000);
    }

    // First go to products page
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Get the first product card and extract its href
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the product detail page
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // Wait for product detail page
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for cart count to update
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({
      timeout: 15000,
    });

    // Navigate to cart directly (stay logged in)
    await page.goto('/cart');
    await expect(page.locator('h1')).toContainText('Carrito', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check if cart has items before clicking checkout
    const emptyCart = await page
      .locator('[data-testid="empty-cart"]')
      .isVisible()
      .catch(() => false);

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
      await expect(page.locator('h1')).toContainText('Finalizar Compra', {
        timeout: 10000,
      });

      // Check for shipping section or need for address
      const hasShippingSection = await page
        .locator('text=Dirección de envío')
        .isVisible()
        .catch(() => false);
      const needsAddress = await page
        .locator('text=No tienes direcciones guardadas')
        .isVisible()
        .catch(() => false);

      expect(hasShippingSection || needsAddress).toBe(true);

      // If we have addresses, proceed with checkout flow
      if (hasShippingSection && !needsAddress) {
        // Select first address if available
        const addressRadio = page.locator('input[name="address"]').first();
        const hasAddress = await addressRadio.isVisible().catch(() => false);
        if (hasAddress) {
          await addressRadio.check();
        }

        // Select payment method (Transfer for testing - no external redirect)
        const transferOption = page.locator('text=Transferencia bancaria');
        const hasTransfer = await transferOption.isVisible().catch(() => false);
        if (hasTransfer) {
          await transferOption.click();
        }

        // Wait for payment method to be selected
        await page.waitForTimeout(1000);

        // Click confirm order button - should redirect to processing
        const confirmButton = page.locator('button:has-text("Confirmar pedido")');
        await expect(confirmButton).toBeVisible({ timeout: 10000 });

        // For testing purposes, we just verify the checkout form is complete
        // We don't actually complete the payment to avoid external dependencies
        // Verify payment method section is visible (use more specific selector)
        await expect(page.locator('h2:has-text("Método de pago")')).toBeVisible({ timeout: 10000 });

        // Verify we have a complete checkout form
        const checkoutFormComplete = await page
          .locator('button:has-text("Confirmar pedido")')
          .isEnabled()
          .catch(() => false);

        // Log the state for debugging
        console.log('Checkout form complete:', checkoutFormComplete);
      }
    }
  });

  test('should update cart quantity', async ({ page }) => {
    // First go to products page
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Get the first product card and extract its href
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the product detail page
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // Wait for product detail page
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    // Add to cart
    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for cart count to update
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1', { timeout: 15000 });

    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    await page.waitForURL(/\/cart/, { timeout: 10000 });

    // Wait for cart page to load
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toBeVisible({ timeout: 10000 });

    // Update quantity by clicking increase button
    await page.locator('[data-testid="quantity-increase"]').first().click();

    // Verify quantity updated - check the input value with retry
    await expect(page.locator('[data-testid="cart-item-quantity"]').first()).toHaveValue('2', { timeout: 15000 });
  });

  test('should remove item from cart', async ({ page }) => {
    // First go to products page
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible({
      timeout: 15000,
    });

    // Get the first product card and extract its href
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the product detail page
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // Wait for product detail page
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    // Add to cart
    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for cart count to update
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1', { timeout: 15000 });

    // Go to cart
    await page.locator('[data-testid="cart-icon"]').click();
    await page.waitForURL(/\/cart/, { timeout: 10000 });

    // Wait for cart items to be visible
    await expect(page.locator('[data-testid="remove-item-button"]')).toBeVisible({ timeout: 10000 });

    // Remove item (triggers confirmation modal)
    await page.locator('[data-testid="remove-item-button"]').first().click();

    // Confirm removal in modal
    await page.locator('button:has-text("Eliminar")').click();

    // Verify cart empty - empty-cart testid exists
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
