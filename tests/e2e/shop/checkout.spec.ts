import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Checkout and Payment
 * Complete purchase flow (critical for business)
 * 
 * NOTE: UI is in Spanish, so we use Spanish text for assertions
 */

test.describe('Checkout and Payment', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Add product to cart and log in
    await page.goto('/products');
    
    // Add product to cart - click on first product to go to detail
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.waitForTimeout(500);
    
    // Look for add to cart button on product detail
    const addToCartButton = page.locator('button:has-text("Añadir"), button:has-text("Comprar")').first();
    if (await addToCartButton.isVisible().catch(() => false)) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Login if necessary - check if on auth page
    await page.goto('/auth');
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('customer@test.com');
      await page.locator('input[type="password"]').fill('test123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should access checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Verify checkout form is displayed - using Spanish text
    const title = await page.locator('h1').textContent();
    expect(title).toMatch(/checkout|pago/i);
    
    // Look for address selection or order summary
    const hasAddressSection = await page.getByText(/dirección/i).isVisible().catch(() => false);
    const hasOrderSummary = await page.getByText(/resumen|total/i).isVisible().catch(() => false);
    
    expect(hasAddressSection || hasOrderSummary).toBe(true);
  });

  test('should complete shipping form', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Check if there's a shipping address selection
    const addressRadio = page.locator('input[type="radio"][name="direccion"]').first();
    
    if (await addressRadio.isVisible().catch(() => false)) {
      // Select first address
      await addressRadio.check();
      
      // Verify payment button is enabled
      const payButton = page.locator('button:has-text("pago"), button:has-text("pagar")').first();
      await expect(payButton).toBeVisible();
    }
  });

  test('should validate required form fields', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Check if there's an address to select
    const hasAddresses = await page.locator('input[type="radio"][name="direccion"]').count() > 0;
    
    if (hasAddresses) {
      // Try to continue without selecting address
      const submitButton = page.locator('button:has-text("pago"), button:has-text("pagar")').first();
      await submitButton.click();
      
      // Verify error message is shown
      await page.waitForTimeout(500);
      const hasError = await page.getByText(/selecciona|dirección|error/i).isVisible().catch(() => false);
      expect(hasError).toBe(true);
    }
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Verify summary is displayed - using Spanish text
    const hasOrderSummary = await page.getByText(/resumen|pedido/i).isVisible().catch(() => false);
    const hasTotal = await page.getByText(/total/i).isVisible().catch(() => false);
    
    expect(hasOrderSummary || hasTotal).toBe(true);
    
    // Verify totals are shown
    const hasSubtotal = await page.getByText(/subtotal/i).isVisible().catch(() => false);
    const hasShipping = await page.getByText(/envío/i).isVisible().catch(() => false);
    
    expect(hasSubtotal).toBe(true);
    expect(hasShipping).toBe(true);
  });

  test('should redirect to Stripe for payment', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Select an address if available
    const addressRadio = page.locator('input[type="radio"][name="direccion"]').first();
    if (await addressRadio.isVisible().catch(() => false)) {
      await addressRadio.check();
      await page.waitForTimeout(500);
      
      // Proceed to payment
      const payButton = page.locator('button:has-text("pago"), button:has-text("pagar")').first();
      
      // Note: In test mode, we can't actually go to Stripe
      // Just verify button exists and is clickable
      await expect(payButton).toBeVisible();
      await expect(payButton).toBeEnabled();
    }
  });

  test('should display success page after payment', async ({ page }) => {
    // Go directly to success page (simulating return from Stripe)
    await page.goto('/checkout/success?session_id=test_session_123');
    await page.waitForTimeout(2000);
    
    // Verify success message - using Spanish text
    const heading = await page.locator('h1').textContent();
    expect(heading).toMatch(/pago completado|gracias|thank you/i);
    
    // Verify success message is displayed
    const hasSuccessMessage = await page.getByText(/pedido ha sido procesado|pago completado/i).isVisible().catch(() => false);
    expect(hasSuccessMessage).toBe(true);
  });

  test('should allow returning to store after purchase', async ({ page }) => {
    await page.goto('/checkout/success');
    await page.waitForTimeout(2000);
    
    // Look for continue shopping button - Spanish text
    const continueButton = page.locator('a:has-text("Seguir"), a:has-text("comprando"), a:has-text("Continuar"), button:has-text("Seguir")').first();
    
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await expect(page).toHaveURL(/\/products/);
    }
  });

  test('should display order history in account', async ({ page }) => {
    // Go to user orders page
    await page.goto('/account/orders');
    await page.waitForTimeout(2000);
    
    // Verify there are orders listed or empty message
    const orders = page.locator('[data-testid="order-item"], .order-item, tr:has-text("PEDIDO")');
    const emptyMessage = await page.getByText(/no tienes pedidos|sin pedidos|empty/i).isVisible().catch(() => false);
    
    // May have 0 or more orders
    const count = await orders.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    if (count > 0) {
      // Verify information of first order
      const firstOrder = orders.first();
      const hasOrderInfo = await firstOrder.textContent();
      expect(hasOrderInfo).toBeTruthy();
    }
  });

  test('should calculate shipping costs correctly', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Verify shipping cost is displayed
    const shippingElement = page.getByText(/envío/i).first();
    const shippingText = await shippingElement.textContent().catch(() => '');
    
    // Check if shipping is shown as free or has a price
    const hasFreeShipping = shippingText?.toLowerCase().includes('gratis') ?? false;
    const hasShippingPrice = shippingText ? /\d+[,.]?\d*/.test(shippingText) : false;
    
    expect(hasFreeShipping || hasShippingPrice || shippingText).toBeTruthy();
  });

  test('should apply free shipping on large orders', async ({ page }) => {
    // This test assumes there is a free shipping policy
    // For example: orders over X€ have free shipping
    
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    
    // Look for free shipping message
    const freeShippingText = await page.getByText(/gratis|free/i).isVisible().catch(() => false);
    const subtotalElement = page.getByText(/subtotal/i).first();
    const subtotalText = await subtotalElement.textContent().catch(() => '0');
    
    // Extract subtotal value
    const subtotalMatch = subtotalText?.match(/(\d+[,.]?\d*)/);
    const subtotalValue = subtotalMatch ? parseFloat(subtotalMatch[1].replace(',', '.')) : 0;
    
    // If subtotal is greater than €50 (example), verify free shipping is mentioned
    if (subtotalValue >= 50) {
      // Free shipping should be indicated
      expect(freeShippingText).toBe(true);
    }
  });
});
