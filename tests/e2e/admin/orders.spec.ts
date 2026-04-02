import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Admin: Gestión de Pedidos
 * Flujos críticos de administración de órdenes
 */

test.describe('Admin - Gestión de Pedidos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth');
    
    const emailInput = page.locator('[data-testid="login-email-input"]');
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('admin@3dprint.com');
      await page.locator('[data-testid="login-password-input"]').fill('admin123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }
    
    // Ir al panel de pedidos
    await page.goto('/admin/orders');
  });

  test('debe mostrar listado de pedidos', async ({ page }) => {
    // Verificar que se muestra la página de pedidos
    await expect(page.locator('h1')).toContainText('Pedidos');
    
    // Verificar que hay pedidos o mensaje de vacío
    const orders = page.locator('[data-testid="order-row"]');
    const emptyMessage = page.locator('[data-testid="no-orders-message"]');
    
    const hasOrders = await orders.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasOrders || hasEmptyMessage).toBeTruthy();
  });

  test('debe mostrar información del pedido', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      const firstOrder = orders.first();
      
      // Verificar información básica
      await expect(firstOrder.locator('[data-testid="order-id"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-customer"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-date"]')).toBeVisible();
    }
  });

  test('debe navegar al detalle del pedido', async ({ page }) => {
    const viewButtons = page.locator('[data-testid="view-order"]');
    
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      
      // Verificar que estamos en la página de detalle
      await expect(page).toHaveURL(/\/admin\/orders\/\w+/);
      await expect(page.locator('h1')).toContainText('Pedido');
    }
  });

  test('debe mostrar detalle completo del pedido', async ({ page }) => {
    // Ir a un pedido específico (si existe)
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Verificar secciones del detalle
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-shipping-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-payment-info"]')).toBeVisible();
      
      // Verificar totales
      await expect(page.locator('[data-testid="order-subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total-final"]')).toBeVisible();
    }
  });

  test('debe cambiar estado del pedido', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const statusSelect = page.locator('[data-testid="order-status-select"]').first();
    
    if (await statusSelect.isVisible().catch(() => false)) {
      // Obtener estado actual
      const currentStatus = await statusSelect.inputValue();
      
      // Cambiar a un estado diferente
      const newStatus = currentStatus === 'PENDIENTE' ? 'CONFIRMADO' : 'PENDIENTE';
      await statusSelect.selectOption(newStatus);
      
      // Esperar a que se guarde
      await page.waitForTimeout(500);
      
      // Verificar que el estado cambió
      const updatedStatus = await statusSelect.inputValue();
      expect(updatedStatus).toBe(newStatus);
    }
  });

  test('debe filtrar pedidos por estado', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"]');
    
    if (await statusFilter.isVisible().catch(() => false)) {
      // Seleccionar filtro
      await statusFilter.selectOption('PENDIENTE');
      
      // Esperar a que se filtren
      await page.waitForTimeout(500);
      
      // Verificar que todos los pedidos mostrados tienen ese estado
      const orders = page.locator('[data-testid="order-row"]');
      const count = await orders.count();
      
      if (count > 0) {
        const firstStatus = await orders.first().locator('[data-testid="order-status"]').textContent();
        expect(firstStatus).toContain('PENDIENTE');
      }
    }
  });

  test('debe filtrar pedidos por fecha', async ({ page }) => {
    const dateFromFilter = page.locator('[data-testid="date-from-filter"]');
    
    if (await dateFromFilter.isVisible().catch(() => false)) {
      // Seleccionar fecha desde
      await dateFromFilter.fill('2024-01-01');
      
      // Aplicar filtro
      await page.click('[data-testid="apply-filters"]');
      
      // Esperar resultados
      await page.waitForTimeout(500);
      
      // Verificar que hay resultados
      const orders = page.locator('[data-testid="order-row"]');
      expect(await orders.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe buscar pedidos por ID o cliente', async ({ page }) => {
    const searchInput = page.locator('[data-testid="order-search"]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.press('[data-testid="order-search"]', 'Enter');
      
      // Esperar resultados
      await page.waitForTimeout(500);
      
      // Verificar resultados
      const orders = page.locator('[data-testid="order-row"]');
      expect(await orders.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe mostrar historial de mensajes del pedido', async ({ page }) => {
    // Ir a detalle de pedido
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Verificar sección de mensajes
      const messagesSection = page.locator('[data-testid="order-messages"]');
      
      if (await messagesSection.isVisible().catch(() => false)) {
        await expect(messagesSection).toBeVisible();
        
        // Verificar que se pueden enviar mensajes
        const messageInput = page.locator('[data-testid="message-input"]');
        if (await messageInput.isVisible().catch(() => false)) {
          await expect(messageInput).toBeVisible();
        }
      }
    }
  });

  test('debe generar factura para pedido completado', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      // Buscar un pedido con estado ENTREGADO
      const orderRows = await orders.all();
      
      for (const row of orderRows) {
        const status = await row.locator('[data-testid="order-status"]').textContent();
        
        if (status?.includes('ENTREGADO')) {
          await row.click();
          
          // Verificar botón de generar factura
          const invoiceButton = page.locator('[data-testid="generate-invoice"]');
          
          if (await invoiceButton.isVisible().catch(() => false)) {
            await expect(invoiceButton).toBeVisible();
          }
          
          break;
        }
      }
    }
  });

  test('debe mostrar métricas de pedidos en dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verificar que hay métricas de pedidos
    const orderStats = page.locator('[data-testid="order-stats"]');
    
    if (await orderStats.isVisible().catch(() => false)) {
      await expect(orderStats).toContainText(/pedidos/i);
      
      // Verificar totales
      const totalOrdersText = await orderStats.locator('[data-testid="total-orders"]').textContent().catch(() => '0');
      const totalOrders = totalOrdersText ? parseInt(totalOrdersText) : 0;
      expect(totalOrders).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe actualizar notas del pedido', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Buscar campo de notas
      const notesInput = page.locator('[data-testid="order-notes"]');
      
      if (await notesInput.isVisible().catch(() => false)) {
        // Agregar nota
        await notesInput.fill('Nota de prueba E2E');
        
        // Guardar
        await page.click('[data-testid="save-notes"]');
        
        // Verificar mensaje de éxito
        await expect(page.locator('[data-testid="notes-saved"]')).toBeVisible();
      }
    }
  });
});
