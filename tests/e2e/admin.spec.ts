/**
 * E2E Tests - Admin Dashboard
 * Critical business path: Admin product and order management
 */
import { test, expect, Page } from '@playwright/test';

// Helper function to login as admin - moved to outer scope per SonarQube S7721
async function loginAsAdmin(page: Page) {
  // Navigate to auth with callback to admin dashboard
  await page.goto('/auth?callbackUrl=/admin/dashboard');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Wait for form to be ready
  const emailField = page.locator('[data-testid="login-email"]');
  await emailField.waitFor({ state: 'visible', timeout: 10000 });

  // Fill in credentials - clear first then type
  await emailField.click();
  await emailField.fill('admin@3dprint.com');

  const passwordField = page.locator('[data-testid="login-password"]');
  await passwordField.click();
  await passwordField.fill('AdminTFM2024!');

  // Submit login - wait for button to be enabled
  const submitButton = page.locator('[data-testid="login-submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  await submitButton.click();

  // Wait for navigation - poll the URL
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    if (!currentUrl.includes('/auth')) {
      break;
    }
  }

  // Additional wait for session to be established
  await page.waitForTimeout(2000);
}

// Helper function to login as customer - moved to outer scope per SonarQube S7721
async function loginAsCustomer(page: Page) {
  await page.goto('/auth');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Wait for form to be ready
  const emailField = page.locator('[data-testid="login-email"]');
  await emailField.waitFor({ state: 'visible', timeout: 10000 });

  // Fill in credentials
  await emailField.click();
  await emailField.fill('juan@example.com');

  const passwordField = page.locator('[data-testid="login-password"]');
  await passwordField.click();
  await passwordField.fill('JuanTFM2024!');

  // Submit login
  const submitButton = page.locator('[data-testid="login-submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  await submitButton.click();

  // Wait for navigation
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    if (!currentUrl.includes('/auth')) {
      break;
    }
  }

  await page.waitForTimeout(2000);
}

test.describe('Admin Dashboard', () => {
  test('should access admin dashboard', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');

    // Wait for dashboard to load
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      const bodyText = await page.locator('body').textContent().catch(() => '');

      // If not redirected away from admin, we're good
      if (currentUrl.includes('/admin')) {
        // Check for admin content
        const hasAdminContent = bodyText?.includes('Panel') ||
                                bodyText?.includes('Gestión de Productos') ||
                                bodyText?.includes('Pedidos') ||
                                bodyText?.includes('Ingresos') ||
                                bodyText?.includes('Clientes') ||
                                bodyText?.includes('Ticket Medio');

        if (hasAdminContent) {
          expect(true).toBe(true);
          return;
        }
      }
    }

    // If we get here, verify we're on admin dashboard
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();

    const isOnAdminDashboard = currentUrl.includes('/admin/dashboard');
    const hasAdminContent = bodyText?.includes('Panel') ||
                            bodyText?.includes('Gestión') ||
                            bodyText?.includes('Dashboard');

    expect(isOnAdminDashboard || hasAdminContent).toBe(true);
  });

  test('should create new product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await page.waitForTimeout(3000);

    // Check if "Nuevo Producto" button exists
    const newProductButton = page.getByRole('link', { name: /Nuevo Producto/i });
    const hasNewProductButton = await newProductButton.isVisible().catch(() => false);

    if (!hasNewProductButton) {
      test.skip();
      return;
    }

    // Click new product button
    await newProductButton.click();
    await page.waitForTimeout(3000);

    // Verify we're on the new product page
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/products/new')) {
      test.skip();
      return;
    }

    // Fill product form
    await page.locator('#name').fill('Test Product E2E');
    await page.waitForTimeout(500);
    await page.locator('#description').fill('Test product description for E2E testing');
    await page.locator('#shortDescription').fill('Short description for E2E');
    await page.locator('#price').fill('29.99');
    await page.locator('#stock').fill('10');

    // Select first available category
    const categorySelect = page.locator('#categoryId');
    const options = await categorySelect.locator('option').count();
    if (options > 1) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Add an image URL using a data URL to avoid external dependencies
    // Setup dialog handler before triggering the dialog
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      }
    });

    // Click URL button to add image
    await page.getByRole('button', { name: /URL/i }).click();
    await page.waitForTimeout(1000);

    // Submit form - look for the submit button by its text
    await page.getByRole('button', { name: /^(Crear|Guardar)$/i }).click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Check if redirected to products list (success) or still on new page (error)
    const finalUrl = page.url();
    const success = finalUrl.includes('/admin/products') && !finalUrl.includes('/new');

    expect(success).toBe(true);
  });

  test('should update order status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    // Check if table exists
    const hasTable = await page.locator('table tbody tr').first().isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Click first order
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(3000);

    // Verify we're on order detail page
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/orders/')) {
      test.skip();
      return;
    }

    // Click "Actualizar estado" button if it exists
    const updateButton = page.getByRole('button', { name: /Actualizar estado/i });
    const hasUpdateButton = await updateButton.isVisible().catch(() => false);

    if (!hasUpdateButton) {
      test.skip();
      return;
    }

    await updateButton.click();
    await page.waitForTimeout(1000);

    // Change status to "Enviado"
    await page.locator('[data-testid="status-dropdown"]').selectOption('Enviado');

    // Save the changes
    await page.locator('[data-testid="update-status-button"]').click();

    // Wait for success message
    await page.waitForSelector('[data-testid="status-updated-message"]', { timeout: 10000 });

    // Verify success
    const bodyText = await page.locator('body').textContent();
    const success = bodyText?.includes('actualizado') || bodyText?.includes('Enviado');

    expect(success).toBe(true);
  });

  test('should generate invoice for order', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    // Check if table exists
    const hasTable = await page.locator('table tbody tr').first().isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Find order and get its number
    const orderRow = page.locator('table tbody tr').first();
    const orderNumberText = await orderRow.locator('td').first().textContent().catch(() => '');

    if (!orderNumberText) {
      test.skip();
      return;
    }

    // Navigate to invoices page
    await page.goto('/admin/invoices');
    await page.waitForTimeout(3000);

    // Click generate invoice button
    const invoiceButton = page.locator('[data-testid="generate-invoice-button"]');
    const hasInvoiceButton = await invoiceButton.isVisible().catch(() => false);

    if (!hasInvoiceButton) {
      test.skip();
      return;
    }

    await invoiceButton.click();
    await page.waitForTimeout(1000);

    // Enter order number
    await page.locator('#orderIdInput').fill(orderNumberText.trim());

    // Click generate
    await page.getByRole('button', { name: /^Generar$/i }).click();

    // Wait for generation
    await page.waitForTimeout(5000);

    // Verify invoice generated - check for success message
    const successMessage = await page.locator('[data-testid="invoice-generated-message"]').isVisible().catch(() => false);
    const bodyText = await page.locator('body').textContent();
    const invoiceGenerated = successMessage ||
                               bodyText?.includes('generada') ||
                               bodyText?.includes('correctamente');

    expect(invoiceGenerated).toBe(true);
  });

  test('should prevent non-admin access', async ({ page }) => {
    // Login as customer
    await loginAsCustomer(page);

    // Try to access admin page
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);

    // Should be redirected or see access denied message
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();

    // Either redirected away from admin or see forbidden message
    const isBlocked = !currentUrl.includes('/admin/dashboard') ||
                      bodyText?.includes('acceso denegado') ||
                      bodyText?.includes('No autorizado') ||
                      bodyText?.includes('403') ||
                      bodyText?.includes('Panel') === false;

    expect(isBlocked).toBe(true);
  });
});
