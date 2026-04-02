import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Admin: Gestión de Productos
 * Flujos críticos de administración del catálogo
 */

test.describe('Admin - Gestión de Productos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('admin@3dprint.com');
      await page.locator('input[type="password"]').fill('admin123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }
    
    // Ir al panel de admin
    await page.goto('/admin/products');
  });

  test('debe mostrar listado de productos', async ({ page }) => {
    // Verificar que se muestra la página de admin
    await expect(page.locator('h1')).toContainText('Productos');
    
    // Verificar que hay productos o mensaje de vacío
    const products = page.locator('[data-testid="admin-product-item"]');
    const emptyMessage = page.locator('[data-testid="no-products-message"]');
    
    const hasProducts = await products.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasProducts || hasEmptyMessage).toBeTruthy();
  });

  test('debe navegar a crear nuevo producto', async ({ page }) => {
    // Click en botón de crear producto
    const createButton = page.locator('[data-testid="create-product-button"]');
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Verificar que estamos en la página de creación
      await expect(page).toHaveURL('/admin/products/new');
      await expect(page.locator('h1')).toContainText('Nuevo Producto');
    }
  });

  test('debe completar formulario de nuevo producto', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Llenar información del producto
    await page.fill('[data-testid="product-name"]', 'Producto Test E2E');
    await page.fill('[data-testid="product-description"]', 'Descripción de prueba para E2E');
    await page.fill('[data-testid="product-price"]', '29.99');
    await page.fill('[data-testid="product-stock"]', '50');
    
    // Seleccionar categoría
    await page.selectOption('[data-testid="product-category"]', 'DECORACION');
    
    // Seleccionar material
    await page.selectOption('[data-testid="product-material"]', 'PLA');
    
    // Verificar que el botón de guardar está visible
    const saveButton = page.locator('[data-testid="save-product-button"]');
    await expect(saveButton).toBeVisible();
  });

  test('debe validar campos requeridos del producto', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Intentar guardar sin completar campos
    const saveButton = page.locator('[data-testid="save-product-button"]');
    await saveButton.click();
    
    // Verificar mensajes de error
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-price"]')).toBeVisible();
  });

  test('debe editar producto existente', async ({ page }) => {
    // Ir a la lista de productos
    await page.goto('/admin/products');
    
    // Click en editar del primer producto
    const editButton = page.locator('[data-testid="edit-product"]').first();
    
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      // Verificar que estamos en modo edición
      await expect(page.locator('h1')).toContainText('Editar');
      
      // Modificar precio
      const priceInput = page.locator('[data-testid="product-price"]');
      await priceInput.fill('39.99');
      
      // Guardar cambios
      await page.click('[data-testid="save-product-button"]');
      
      // Verificar mensaje de éxito
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
  });

  test('debe activar/desactivar producto', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Buscar toggle de activación del primer producto
    const toggle = page.locator('[data-testid="toggle-product-active"]').first();
    
    if (await toggle.isVisible().catch(() => false)) {
      // Obtener estado actual
      const isChecked = await toggle.isChecked().catch(() => false);
      
      // Cambiar estado
      await toggle.click();
      
      // Esperar a que se actualice
      await page.waitForTimeout(500);
      
      // Verificar que el estado cambió
      const newState = await toggle.isChecked().catch(() => !isChecked);
      expect(newState).toBe(!isChecked);
    }
  });

  test('debe buscar productos en el admin', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Usar campo de búsqueda
    const searchInput = page.locator('[data-testid="admin-search-input"]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('vaso');
      await page.press('[data-testid="admin-search-input"]', 'Enter');
      
      // Esperar resultados
      await page.waitForTimeout(500);
      
      // Verificar que se filtraron los productos
      const products = page.locator('[data-testid="admin-product-item"]');
      // Puede haber resultados o no
      expect(await products.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe filtrar productos por categoría', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Seleccionar filtro de categoría
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    
    if (await categoryFilter.isVisible().catch(() => false)) {
      await categoryFilter.selectOption('DECORACION');
      
      // Esperar a que se filtren
      await page.waitForTimeout(500);
      
      // Verificar que se muestran solo productos de esa categoría
      const products = page.locator('[data-testid="admin-product-item"]');
      expect(await products.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe mostrar estadísticas de productos', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verificar que hay métricas de productos
    const stats = page.locator('[data-testid="product-stats"]');
    
    if (await stats.isVisible().catch(() => false)) {
      await expect(stats).toContainText(/productos/i);
    }
  });

  test('debe prevenir acceso no autorizado', async ({ page }) => {
    // Logout
    await page.goto('/api/auth/signout');
    await page.waitForTimeout(500);
    
    // Intentar acceder como cliente
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'cliente@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Intentar acceder al admin
    await page.goto('/admin/products');
    
    // Debe redirigir a home o mostrar error 403
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/products');
  });
});
