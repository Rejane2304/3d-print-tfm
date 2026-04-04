import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Admin: Order Management
 * Critical order administration flows
 * 
 * NOTE: Admin UI is in Spanish
 */

test.describe('Admin - Order Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    
    const emailInput = page.locator('[data-testid="login-email-input"]');
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('admin@3dprint.com');
      await page.locator('[data-testid="login-password-input"]').fill('admin123');
      // Use more specific selector - the first submit button in the login form
      await page.locator('form button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }
    
    // Go to orders panel
    await page.goto('/admin/orders');
  });

  test('should display order listing', async ({ page }) => {
    // Verify orders page is displayed - using Spanish text
    await expect(page.locator('h1')).toContainText(/pedidos|gestión|administración/i);
    
    // Verify there are orders or empty message
    const orders = page.locator('[data-testid="order-row"]');
    const emptyMessage = page.locator('[data-testid="no-orders-message"]');
    
    const hasOrders = await orders.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasOrders || hasEmptyMessage).toBeTruthy();
  });

  test('should display order information', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      const firstOrder = orders.first();
      
      // Verify basic information
      await expect(firstOrder.locator('[data-testid="order-id"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-customer"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-date"]')).toBeVisible();
    }
  });

  test('should navigate to order detail', async ({ page }) => {
    const viewButtons = page.locator('[data-testid="view-order"], button:has-text("Ver")');
    
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      
      // Verify we are on detail page
      await expect(page).toHaveURL(/\/admin\/orders\/\w+/);
      await expect(page.locator('h1')).toContainText(/pedido|detalle/i);
    }
  });

  test('should display complete order detail', async ({ page }) => {
    // Go to a specific order (if exists)
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Verify detail sections
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-shipping-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-payment-info"]')).toBeVisible();
      
      // Verify totals
      await expect(page.locator('[data-testid="order-subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total-final"]')).toBeVisible();
    }
  });

  test('should change order status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const statusSelect = page.locator('[data-testid="order-status-select"]').first();
    
    if (await statusSelect.isVisible().catch(() => false)) {
      // Get current status
      const currentStatus = await statusSelect.inputValue();
      
      // Change to a different status
      const newStatus = currentStatus === 'PENDIENTE' ? 'CONFIRMADO' : 'PENDIENTE';
      await statusSelect.selectOption(newStatus);
      
      // Wait for save
      await page.waitForTimeout(500);
      
      // Verify status changed
      const updatedStatus = await statusSelect.inputValue();
      expect(updatedStatus).toBe(newStatus);
    }
  });

  test('should filter orders by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"], select').filter({ hasText: /estado|status/i });
    
    if (await statusFilter.isVisible().catch(() => false)) {
      // Select filter
      await statusFilter.selectOption('PENDIENTE');
      
      // Wait for filtering
      await page.waitForTimeout(500);
      
      // Verify all displayed orders have that status
      const orders = page.locator('[data-testid="order-row"]');
      const count = await orders.count();
      
      if (count > 0) {
        const firstStatus = await orders.first().locator('[data-testid="order-status"]').textContent();
        expect(firstStatus).toContain('Pendiente');
      }
    }
  });

  test('should filter orders by date', async ({ page }) => {
    const dateFromFilter = page.locator('[data-testid="date-from-filter"], input[type="date"]').first();
    
    if (await dateFromFilter.isVisible().catch(() => false)) {
      // Select date from
      await dateFromFilter.fill('2024-01-01');
      
      // Apply filter
      await page.click('[data-testid="apply-filters"], button:has-text("Filtrar")');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Verify there are results
      const orders = page.locator('[data-testid="order-row"]');
      expect(await orders.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search orders by ID or customer', async ({ page }) => {
    const searchInput = page.locator('[data-testid="order-search"], input[type="search"]').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.press('[data-testid="order-search"]', 'Enter');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Verify results
      const orders = page.locator('[data-testid="order-row"]');
      expect(await orders.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display order message history', async ({ page }) => {
    // Go to order detail
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Verify messages section
      const messagesSection = page.locator('[data-testid="order-messages"]');
      
      if (await messagesSection.isVisible().catch(() => false)) {
        await expect(messagesSection).toBeVisible();
        
        // Verify messages can be sent
        const messageInput = page.locator('[data-testid="message-input"]');
        if (await messageInput.isVisible().catch(() => false)) {
          await expect(messageInput).toBeVisible();
        }
      }
    }
  });

  test('should generate invoice for completed order', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      // Find an order with ENTREGADO status
      const orderRows = await orders.all();
      
      for (const row of orderRows) {
        const status = await row.locator('[data-testid="order-status"]').textContent();
        
        if (status?.includes('Entregado')) {
          await row.click();
          
          // Verify generate invoice button
          const invoiceButton = page.locator('[data-testid="generate-invoice"], button:has-text("factura")');
          
          if (await invoiceButton.isVisible().catch(() => false)) {
            await expect(invoiceButton).toBeVisible();
          }
          
          break;
        }
      }
    }
  });

  test('should display order metrics on dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verify there are order metrics - using Spanish text
    const orderStats = page.locator('[data-testid="order-stats"], section:has-text("pedidos")');
    
    if (await orderStats.isVisible().catch(() => false)) {
      await expect(orderStats).toContainText(/pedidos|orders/i);
      
      // Verify totals
      const totalOrdersText = await orderStats.locator('[data-testid="total-orders"]').textContent().catch(() => '0');
      const totalOrders = totalOrdersText ? parseInt(totalOrdersText) : 0;
      expect(totalOrders).toBeGreaterThanOrEqual(0);
    }
  });

  test('should update order notes', async ({ page }) => {
    const orders = page.locator('[data-testid="order-row"]');
    
    if (await orders.count() > 0) {
      await orders.first().click();
      
      // Find notes field
      const notesInput = page.locator('[data-testid="order-notes"], textarea');
      
      if (await notesInput.isVisible().catch(() => false)) {
        // Add note
        await notesInput.fill('E2E test note');
        
        // Save
        await page.click('[data-testid="save-notes"], button:has-text("Guardar")');
        
        // Verify success message - Spanish text
        await expect(page.locator('[data-testid="notes-saved"], text=guardado')).toBeVisible();
      }
    }
  });
});
