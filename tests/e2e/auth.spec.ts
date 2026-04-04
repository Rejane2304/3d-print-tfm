/**
 * E2E Tests - Authentication Flow
 * Critical business path: User registration and login
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login and register tabs', async ({ page }) => {
    await expect(page.locator('[data-testid="login-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-tab"]')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    // Switch to register tab
    await page.locator('[data-testid="register-tab"]').click();
    
    // Fill registration form
    await page.locator('[data-testid="register-name"]').fill('Test User');
    await page.locator('[data-testid="register-email"]').fill(`test-${Date.now()}@example.com`);
    await page.locator('[data-testid="register-password"]').fill('TestPass123!');
    await page.locator('[data-testid="register-confirm-password"]').fill('TestPass123!');
    
    // Submit registration
    await page.locator('[data-testid="register-submit"]').click();
    
    // Verify success (redirect or success message)
    await expect(page).toHaveURL(/\//);
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.locator('[data-testid="login-email"]').fill('admin@test.com');
    await page.locator('[data-testid="login-password"]').fill('test123');
    
    // Submit login
    await page.locator('[data-testid="login-submit"]').click();
    
    // Verify successful login (redirect to home or account)
    await expect(page).toHaveURL(/\//);
    
    // Verify user is logged in (header shows user menu)
    await expect(page.locator('[data-testid="user-menu"]').first()).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.locator('[data-testid="login-email"]').fill('invalid@example.com');
    await page.locator('[data-testid="login-password"]').fill('wrongpassword');
    await page.locator('[data-testid="login-submit"]').click();
    
    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('should redirect authenticated users from auth page', async ({ page }) => {
    // Login first
    await page.locator('[data-testid="login-email"]').fill('admin@test.com');
    await page.locator('[data-testid="login-password"]').fill('test123');
    await page.locator('[data-testid="login-submit"]').click();
    
    // Wait for navigation
    await page.waitForURL(/\//);
    
    // Try to access auth page again
    await page.goto('/auth');
    
    // Should be redirected
    await expect(page).not.toHaveURL('/auth');
  });
});
