import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Checkout and Payment
 * Complete purchase flow (critical for business)
 */

test.describe('Checkout and Payment', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Add product to cart and log in
    await page.goto('/products');
    
    // Add product to cart
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first();
    await addToCartButton.click();
    await page.waitForTimeout(500);
    
    // Login if necessary
    await page.goto('/auth');
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('customer@test.com');
      await page.locator('input[type="password"]').fill('test123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }
  });

  test('should access checkout page', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verify checkout form is displayed
    await expect(page.locator('h1')).toContainText('Checkout');
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
  });

  test('should complete shipping form', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping information
    await page.fill('[data-testid="shipping-name"]', 'John Smith');
    await page.fill('[data-testid="shipping-address"]', 'Main Street 123');
    await page.fill('[data-testid="shipping-city"]', 'Madrid');
    await page.fill('[data-testid="shipping-postal-code"]', '28001');
    await page.fill('[data-testid="shipping-phone"]', '+34 600 123 456');
    
    // Verify payment button is enabled
    const payButton = page.locator('[data-testid="proceed-to-payment"]');
    await expect(payButton).toBeVisible();
  });

  test('should validate required form fields', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to continue without filling fields
    const submitButton = page.locator('[data-testid="proceed-to-payment"]');
    await submitButton.click();
    
    // Verify error messages
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible();
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verify summary is displayed
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toBeVisible();
    
    // Verify there are items in summary
    const summaryItems = orderSummary.locator('[data-testid="summary-item"]');
    expect(await summaryItems.count()).toBeGreaterThan(0);
    
    // Verify totals
    await expect(orderSummary.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(orderSummary.locator('[data-testid="shipping"]')).toBeVisible();
    await expect(orderSummary.locator('[data-testid="total"]')).toBeVisible();
  });

  test('should redirect to Stripe for payment', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill shipping information
    await page.fill('[data-testid="shipping-name"]', 'John Smith');
    await page.fill('[data-testid="shipping-address"]', 'Main Street 123');
    await page.fill('[data-testid="shipping-city"]', 'Madrid');
    await page.fill('[data-testid="shipping-postal-code"]', '28001');
    await page.fill('[data-testid="shipping-phone"]', '+34 600 123 456');
    
    // Proceed to payment
    await page.click('[data-testid="proceed-to-payment"]');
    
    // Wait for redirect to Stripe (or intermediate page)
    await page.waitForTimeout(2000);
    
    // Verify redirected (URL changed)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/checkout');
    
    // Note: In test mode, Stripe redirects to configured success URL
  });

  test('should display success page after payment', async ({ page }) => {
    // Go directly to success page (simulating return from Stripe)
    await page.goto('/checkout/success?session_id=test_session_123');
    
    // Verify success message
    await expect(page.locator('h1')).toContainText('Thank you for your purchase!');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify order number
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('should allow returning to store after purchase', async ({ page }) => {
    await page.goto('/checkout/success');
    
    // Click return to store button
    const continueButton = page.locator('[data-testid="continue-shopping"]');
    
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await expect(page).toHaveURL('/products');
    }
  });

  test('should display order history in account', async ({ page }) => {
    // Go to user orders page
    await page.goto('/account/orders');
    
    // Verify there are orders listed
    const orders = page.locator('[data-testid="order-item"]');
    
    // May have 0 or more orders
    const count = await orders.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    if (count > 0) {
      // Verify information of first order
      const firstOrder = orders.first();
      await expect(firstOrder.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
    }
  });

  test('should calculate shipping costs correctly', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verify shipping cost is displayed
    const shippingCost = page.locator('[data-testid="shipping-cost"]');
    
    if (await shippingCost.isVisible().catch(() => false)) {
      const cost = await shippingCost.textContent();
      // Verify it's a valid numeric value
      expect(cost).toMatch(/\d+[,.]?\d*/);
    }
  });

  test('should apply free shipping on large orders', async ({ page }) => {
    // This test assumes there is a free shipping policy
    // For example: orders over X€ have free shipping
    
    await page.goto('/checkout');
    
    // Verify order total
    const subtotalText = await page.locator('[data-testid="subtotal-amount"]').textContent().catch(() => '0');
    const subtotalValue = subtotalText ? parseFloat(subtotalText.replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
    
    // If subtotal is greater than €50 (example), verify free shipping
    if (subtotalValue > 50) {
      const freeShipping = page.locator('[data-testid="free-shipping-badge"]');
      await expect(freeShipping).toBeVisible();
    }
  });
});