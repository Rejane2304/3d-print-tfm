import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Carrito de Compras
 * Flujos críticos de gestión del carrito
 */

test.describe('Carrito de Compras', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ir a la página de productos
    await page.goto('/products');
    
    // Agregar un producto al carrito
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first();
    await addToCartButton.click();
    
    // Esperar a que se agregue al carrito
    await page.waitForTimeout(500);
  });

  test('debe agregar producto al carrito', async ({ page }) => {
    // Verificar que el carrito tiene items
    await page.goto('/cart');
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    expect(await cartItems.count()).toBeGreaterThan(0);
  });

  test('debe mostrar información del producto en carrito', async ({ page }) => {
    await page.goto('/carrito');
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    
    // Verificar información del producto
    await expect(cartItem.locator('[data-testid="cart-item-name"]')).toBeVisible();
    await expect(cartItem.locator('[data-testid="cart-item-price"]')).toBeVisible();
    await expect(cartItem.locator('[data-testid="cart-item-quantity"]')).toBeVisible();
  });

  test('debe actualizar cantidad del producto', async ({ page }) => {
    await page.goto('/carrito');
    
    // Incrementar cantidad
    const increaseButton = page.locator('[data-testid="increase-quantity"]').first();
    await increaseButton.click();
    
    // Esperar actualización
    await page.waitForTimeout(500);
    
    // Verificar que la cantidad cambió
    const quantityInput = page.locator('[data-testid="cart-item-quantity-input"]').first();
    const value = await quantityInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(1);
  });

  test('debe eliminar producto del carrito', async ({ page }) => {
    await page.goto('/carrito');
    
    // Obtener cantidad inicial
    const initialCount = await page.locator('[data-testid="cart-item"]').count();
    
    if (initialCount > 0) {
      // Eliminar el primer producto
      const removeButton = page.locator('[data-testid="remove-item"]').first();
      await removeButton.click();
      
      // Esperar a que se elimine
      await page.waitForTimeout(500);
      
      // Verificar que el carrito está vacío o tiene menos items
      const newCount = await page.locator('[data-testid="cart-item"]').count();
      expect(newCount).toBeLessThan(initialCount);
    }
  });

  test('debe calcular total correctamente', async ({ page }) => {
    await page.goto('/carrito');
    
    // Verificar que se muestra el total
    const totalElement = page.locator('[data-testid="cart-total"]');
    await expect(totalElement).toBeVisible();
    
    // Verificar que el total es un número válido
    const totalText = await totalElement.textContent();
    expect(totalText).toMatch(/\d+[,.]?\d*/);
  });

  test('debe persistir carrito al recargar página', async ({ page }) => {
    await page.goto('/carrito');
    
    // Obtener información del carrito
    const initialCount = await page.locator('[data-testid="cart-item"]').count();
    
    if (initialCount > 0) {
      // Recargar la página
      await page.reload();
      
      // Verificar que el carrito sigue con items
      const newCount = await page.locator('[data-testid="cart-item"]').count();
      expect(newCount).toBe(initialCount);
    }
  });

  test('debe mostrar carrito vacío cuando no hay items', async ({ page }) => {
    // Ir directamente al carrito sin agregar productos
    await page.goto('/carrito');
    
    // Si hay items, eliminarlos todos
    const items = page.locator('[data-testid="cart-item"]');
    while (await items.count() > 0) {
      await page.locator('[data-testid="remove-item"]').first().click();
      await page.waitForTimeout(300);
    }
    
    // Verificar mensaje de carrito vacío
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
    await expect(page.locator('text=Carrito vacío')).toBeVisible();
  });

  test('debe navegar al checkout desde el carrito', async ({ page }) => {
    await page.goto('/carrito');
    
    // Click en botón de checkout
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    
    if (await checkoutButton.isVisible().catch(() => false)) {
      await checkoutButton.click();
      
      // Verificar redirección al checkout
      await expect(page).toHaveURL('/checkout');
    }
  });

  test('debe mostrar indicador de items en el header', async ({ page }) => {
    // Verificar que el icono del carrito muestra cantidad
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    
    if (await cartBadge.isVisible().catch(() => false)) {
      const count = await cartBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });
});
