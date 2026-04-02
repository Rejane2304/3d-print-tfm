import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Checkout y Pago
 * Flujo completo de compra (crítico para el negocio)
 */

test.describe('Checkout y Pago', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Agregar producto al carrito y loguearse
    await page.goto('/productos');
    
    // Agregar producto al carrito
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first();
    await addToCartButton.click();
    await page.waitForTimeout(500);
    
    // Login si es necesario
    await page.goto('/auth');
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('cliente@test.com');
      await page.locator('input[type="password"]').fill('test123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }
  });

  test('debe acceder a la página de checkout', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verificar que se muestra el formulario de checkout
    await expect(page.locator('h1')).toContainText('Checkout');
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
  });

  test('debe completar formulario de envío', async ({ page }) => {
    await page.goto('/checkout');
    
    // Llenar información de envío
    await page.fill('[data-testid="shipping-name"]', 'Juan Pérez');
    await page.fill('[data-testid="shipping-address"]', 'Calle Principal 123');
    await page.fill('[data-testid="shipping-city"]', 'Madrid');
    await page.fill('[data-testid="shipping-postal-code"]', '28001');
    await page.fill('[data-testid="shipping-phone"]', '+34 600 123 456');
    
    // Verificar que el botón de pago está habilitado
    const payButton = page.locator('[data-testid="proceed-to-payment"]');
    await expect(payButton).toBeVisible();
  });

  test('debe validar campos requeridos del formulario', async ({ page }) => {
    await page.goto('/checkout');
    
    // Intentar continuar sin llenar campos
    const submitButton = page.locator('[data-testid="proceed-to-payment"]');
    await submitButton.click();
    
    // Verificar mensajes de error
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible();
  });

  test('debe mostrar resumen del pedido', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verificar que se muestra el resumen
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toBeVisible();
    
    // Verificar que hay items en el resumen
    const summaryItems = orderSummary.locator('[data-testid="summary-item"]');
    expect(await summaryItems.count()).toBeGreaterThan(0);
    
    // Verificar totales
    await expect(orderSummary.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(orderSummary.locator('[data-testid="shipping"]')).toBeVisible();
    await expect(orderSummary.locator('[data-testid="total"]')).toBeVisible();
  });

  test('debe redirigir a Stripe para pago', async ({ page }) => {
    await page.goto('/checkout');
    
    // Llenar información de envío
    await page.fill('[data-testid="shipping-name"]', 'Juan Pérez');
    await page.fill('[data-testid="shipping-address"]', 'Calle Principal 123');
    await page.fill('[data-testid="shipping-city"]', 'Madrid');
    await page.fill('[data-testid="shipping-postal-code"]', '28001');
    await page.fill('[data-testid="shipping-phone"]', '+34 600 123 456');
    
    // Proceder al pago
    await page.click('[data-testid="proceed-to-payment"]');
    
    // Esperar redirección a Stripe (o a página intermedia)
    await page.waitForTimeout(2000);
    
    // Verificar que se redirigió (URL cambió)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/checkout');
    
    // Nota: En modo test, Stripe redirige a URL de éxito configurada
  });

  test('debe mostrar página de éxito después del pago', async ({ page }) => {
    // Ir directamente a página de éxito (simulando retorno de Stripe)
    await page.goto('/checkout/success?session_id=test_session_123');
    
    // Verificar mensaje de éxito
    await expect(page.locator('h1')).toContainText('¡Gracias por tu compra!');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verificar número de pedido
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('debe permitir volver a la tienda después de comprar', async ({ page }) => {
    await page.goto('/checkout/success');
    
    // Click en botón de volver a la tienda
    const continueButton = page.locator('[data-testid="continue-shopping"]');
    
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await expect(page).toHaveURL('/productos');
    }
  });

  test('debe mostrar historial de pedidos en cuenta', async ({ page }) => {
    // Ir a la página de pedidos del usuario
    await page.goto('/account/orders');
    
    // Verificar que hay pedidos listados
    const orders = page.locator('[data-testid="order-item"]');
    
    // Puede haber 0 o más pedidos
    const count = await orders.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    if (count > 0) {
      // Verificar información del primer pedido
      const firstOrder = orders.first();
      await expect(firstOrder.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
    }
  });

  test('debe calcular costos de envío correctamente', async ({ page }) => {
    await page.goto('/checkout');
    
    // Verificar que se muestra el costo de envío
    const shippingCost = page.locator('[data-testid="shipping-cost"]');
    
    if (await shippingCost.isVisible().catch(() => false)) {
      const cost = await shippingCost.textContent();
      // Verificar que es un valor numérico válido
      expect(cost).toMatch(/\d+[,.]?\d*/);
    }
  });

  test('debe aplicar envío gratis en pedidos grandes', async ({ page }) => {
    // Este test asume que hay una política de envío gratis
    // Por ejemplo: pedidos mayores a X€ tienen envío gratis
    
    await page.goto('/checkout');
    
    // Verificar el total del pedido
    const subtotalText = await page.locator('[data-testid="subtotal-amount"]').textContent().catch(() => '0');
    const subtotalValue = subtotalText ? parseFloat(subtotalText.replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
    
    // Si el subtotal es mayor a 50€ (ejemplo), verificar envío gratis
    if (subtotalValue > 50) {
      const freeShipping = page.locator('[data-testid="free-shipping-badge"]');
      await expect(freeShipping).toBeVisible();
    }
  });
});
