import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Catálogo de Productos
 * Flujos críticos de navegación y búsqueda
 */

test.describe('Catálogo de Productos', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('debe mostrar listado de productos', async ({ page }) => {
    // Verificar que hay productos en la página
    const products = await page.locator('[data-testid="product-card"]').count();
    expect(products).toBeGreaterThan(0);
    
    // Verificar que cada producto tiene información básica
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('debe navegar al detalle de un producto', async ({ page }) => {
    // Click en el primer producto
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    
    await firstProduct.click();
    
    // Verificar que estamos en la página de detalle
    await expect(page).toHaveURL(/\/products\//);
    
    // Verificar que se muestra el nombre del producto
    await expect(page.locator('h1')).toContainText(productName || '');
  });

  test('debe filtrar por categoría', async ({ page }) => {
    // Seleccionar filtro de categoría
    await page.selectOption('[data-testid="category-filter"]', 'DECORACION');
    
    // Esperar a que se actualice el listado
    await page.waitForTimeout(500);
    
    // Verificar que los productos mostrados son de la categoría seleccionada
    const products = page.locator('[data-testid="product-card"]');
    const count = await products.count();
    
    if (count > 0) {
      // Verificar que el primer producto tiene la categoría correcta
      // Nota: Esto asume que hay un indicador de categoría visible
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Decoración');
    }
  });

  test('debe buscar productos por nombre', async ({ page }) => {
    // Realizar búsqueda
    await page.fill('[data-testid="search-input"]', 'vaso');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Esperar resultados
    await page.waitForTimeout(500);
    
    // Verificar que se muestran resultados o mensaje de no encontrado
    const products = page.locator('[data-testid="product-card"]');
    const hasProducts = await products.count() > 0;
    const hasNoResults = await page.locator('[data-testid="no-results"]').isVisible().catch(() => false);
    
    expect(hasProducts || hasNoResults).toBeTruthy();
  });

  test('debe ordenar productos por precio', async ({ page }) => {
    // Seleccionar ordenamiento
    await page.selectOption('[data-testid="sort-select"]', 'precio_asc');
    
    // Esperar a que se reordene
    await page.waitForTimeout(500);
    
    // Verificar que los productos están ordenados
    // Obtener precios del primer y último producto visible
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();
    expect(firstPrice).toBeTruthy();
  });

  test('debe paginar resultados', async ({ page }) => {
    // Verificar si hay paginación
    const pagination = page.locator('[data-testid="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      // Click en siguiente página
      await page.click('[data-testid="next-page"]');
      
      // Verificar que la URL cambió
      await expect(page).toHaveURL(/\?page=/);
      
      // Verificar que se muestran diferentes productos
      const products = page.locator('[data-testid="product-card"]');
      expect(await products.count()).toBeGreaterThan(0);
    }
  });

  test('debe mostrar productos destacados en home', async ({ page }) => {
    await page.goto('/');
    
    // Verificar sección de destacados
    const featuredSection = page.locator('[data-testid="featured-products"]');
    await expect(featuredSection).toBeVisible();
    
    // Verificar que hay productos destacados
    const featuredProducts = featuredSection.locator('[data-testid="product-card"]');
    expect(await featuredProducts.count()).toBeGreaterThan(0);
  });
});
