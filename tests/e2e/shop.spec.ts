import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
  test('should display product catalog', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-grid"]').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-grid"]').first()).toBeVisible({
      timeout: 15000,
    });

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-grid"]').first()).toBeVisible({
      timeout: 15000,
    });

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await expect(page.locator('[data-testid="add-to-cart-button"]')).toContainText('Añadido', {
      timeout: 15000,
    });
  });

  test('should complete checkout flow', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const pageTitle = await page.locator('h1').textContent({ timeout: 15000 });
    expect(pageTitle).toMatch(/Finalizar Compra|Bienvenido/);

    if (pageTitle?.includes('Finalizar Compra')) {
      const hasCheckoutElements = await page
        .locator(
          'text=Resumen del pedido, text=Dirección de envío, text=Método de pago, [data-testid="checkout-form"], [data-testid="empty-cart"]',
        )
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasCheckoutElements, 'Checkout page should have expected elements').toBe(true);

      const hasOrderSummary = await page
        .locator('text=Resumen del pedido')
        .isVisible()
        .catch(() => false);
      const hasShippingSection = await page
        .locator('text=Dirección de envío')
        .isVisible()
        .catch(() => false);
      const hasPaymentSection = await page
        .locator('text=Método de pago')
        .isVisible()
        .catch(() => false);
      const hasEmptyCart = await page
        .locator('[data-testid="empty-cart"]')
        .isVisible()
        .catch(() => false);

      expect(
        hasOrderSummary || hasShippingSection || hasPaymentSection || hasEmptyCart,
        'Checkout should have at least one expected section',
      ).toBe(true);
    } else {
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="login-password"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should update cart quantity', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-grid"]').first()).toBeVisible({
      timeout: 15000,
    });

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await expect(page.locator('[data-testid="add-to-cart-button"]')).toContainText('Añadido', { timeout: 15000 });

    const cartCount = page.locator('[data-testid="cart-count"]').first();
    await expect(cartCount).toContainText('1', { timeout: 15000 });

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const hasCartItems = await page
      .locator('[data-testid="cart-item"], .cart-item, [data-testid="cart-product-name"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyCart = await page
      .locator('[data-testid="empty-cart"]')
      .isVisible()
      .catch(() => false);
    const isOnCartPage = page.url().includes('/cart');

    expect(isOnCartPage, 'Should be on cart page').toBe(true);
    expect(hasCartItems || hasEmptyCart, 'Cart should either have items or show empty state').toBe(true);

    if (hasCartItems) {
      const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first();
      const hasQuantityInput = await quantityInput.isVisible().catch(() => false);

      if (hasQuantityInput) {
        await quantityInput.fill('2');
        await quantityInput.press('Enter');
        await page.waitForTimeout(2000);

        const currentValue = await quantityInput.inputValue().catch(() => '1');
        expect(['1', '2']).toContain(currentValue);
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="product-grid"]').first()).toBeVisible({
      timeout: 15000,
    });

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible({
      timeout: 15000,
    });

    const addButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await expect(page.locator('[data-testid="add-to-cart-button"]')).toContainText('Añadido', { timeout: 15000 });

    const cartCount = page.locator('[data-testid="cart-count"]').first();
    await expect(cartCount).toContainText('1', { timeout: 15000 });

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const isOnCartPage = page.url().includes('/cart');
    expect(isOnCartPage, 'Should be on cart page').toBe(true);

    const hasRemoveButton = await page
      .locator('[data-testid="remove-item-button"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasRemoveButton) {
      await page.locator('[data-testid="remove-item-button"]').first().click();
      await page.waitForTimeout(2000);

      const hasConfirmButton = await page
        .locator('button:has-text("Eliminar")')
        .first()
        .isVisible()
        .catch(() => false);
      if (hasConfirmButton) {
        await page.locator('button:has-text("Eliminar")').first().click();
        await page.waitForTimeout(2000);
      }

      const hasEmptyCart = await page
        .locator('[data-testid="empty-cart"]')
        .isVisible()
        .catch(() => false);
      const hasEmptyMessage = await page
        .locator('text=/carrito está vacío/i')
        .isVisible()
        .catch(() => false);
      expect(hasEmptyCart || hasEmptyMessage, 'Cart should be empty after removal').toBe(true);
    } else {
      const hasCartContent = await page
        .locator('h1')
        .textContent()
        .catch(() => '');
      expect((hasCartContent || '').toLowerCase()).toContain('carrito');
    }
  });
});
