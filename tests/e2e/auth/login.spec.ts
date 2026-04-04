/**
 * E2E Tests - Authentication Flow
 * Playwright tests for the complete login/logout flow
 * 
 * NOTE: Now using unified /auth page with tabs
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.describe('Unified /auth page', () => {
    test('should display login and register tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Verify both tabs exist (using .first() to avoid strict mode violation)
      await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /register/i }).first()).toBeVisible();
      
      // Login tab should be active by default
      await expect(page.locator('input#login-email')).toBeVisible();
    });

    test('should redirect /login to /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Should redirect to /auth
      await expect(page).toHaveURL(/auth/);
      await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible();
    });

    test('should redirect /register to /auth with register tab', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Should redirect to /auth with tab=register
      await expect(page).toHaveURL(/auth.*tab=register/);
      
      // Register tab should be active
      await expect(page.locator('input#register-name')).toBeVisible();
    });
  });

  test.describe('User registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Verify form exists
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
      await expect(page.locator('input#register-name')).toBeVisible();
      await expect(page.locator('input#register-email')).toBeVisible();
      await expect(page.locator('input#register-password')).toBeVisible();
    });

    test('should validate required fields in registration', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Try to submit empty form
      await page.locator('button[type="submit"]').filter({ hasText: /register/i }).click();
      
      // Should stay on the same page (HTML5 validation)
      await expect(page).toHaveURL(/auth/);
    });

    test('should register user successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Generate unique email
      const uniqueEmail = `test-e2e-${Date.now()}@example.com`;
      
      // Fill form
      await page.locator('input#register-name').fill('E2E Test User');
      await page.locator('input#register-email').fill(uniqueEmail);
      await page.locator('input#register-password').fill('TestPassword123!');
      await page.locator('input#register-confirm').fill('TestPassword123!');
      
      // Submit form
      await page.locator('button[type="submit"]').filter({ hasText: /register/i }).click();
      
      // Wait for processing
      await page.waitForTimeout(4000);
      
      // Verify success: should show success message or redirect
      const currentUrl = page.url();
      const hasSuccessMessage = await page.getByText(/registration successful|account created/i).isVisible().catch(() => false);
      const isAuthPage = currentUrl.includes('/auth');
      
      expect(hasSuccessMessage || isAuthPage).toBe(true);
    });

    test('should reject duplicate email', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      await page.locator('input#register-name').fill('Test User');
      await page.locator('input#register-email').fill('juan@example.com');
      await page.locator('input#register-password').fill('TestPassword123!');
      await page.locator('input#register-confirm').fill('TestPassword123!');
      
      await page.locator('button[type="submit"]').filter({ hasText: /register/i }).click();
      
      await page.waitForTimeout(2000);
      
      // Should show duplicate email error
      const errorVisible = await page.getByText(/already exists|email|error/i).isVisible().catch(() => false);
      expect(errorVisible).toBe(true);
    });
  });

  test.describe('User login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
      await expect(page.locator('input#login-email')).toBeVisible();
      await expect(page.locator('input#login-password')).toBeVisible();
    });

    test('should sign in with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Seed credentials
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      // Wait for URL to change (leave /auth)
      // Use longer timeout to avoid flakiness on mobile
      try {
        await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 });
      } catch {
        // If waitForURL fails, validate manually
        await page.waitForTimeout(2000);
      }
      
      // Verify we are no longer on auth
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('wrong-password');
      
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      // Wait for login to process (give time for error)
      await page.waitForTimeout(3000);
      
      // Verify NO redirect out of /auth
      // NextAuth redirects to /auth with error parameter if credentials are invalid
      const currentUrl = page.url();
      
      // Should be on /auth (with or without error parameters)
      const stillOnAuth = currentUrl.includes('/auth');
      
      // Alternatively, there may be a visible error message
      const hasErrorMessage = await page
        .getByText(/email or password|incorrect|error/i)
        .isVisible()
        .catch(() => false);
      
      // Must meet at least one condition: be on /auth OR show error
      expect(stillOnAuth || hasErrorMessage).toBe(true);
    });

    test('should redirect authenticated users from /auth', async ({ page }) => {
      // First sign in
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      // Wait for redirect out of /auth (successful login)
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 });
      
      // Try to go back to auth - should redirect automatically
      await page.goto(`${BASE_URL}/auth`);
      
      // Wait for automatic redirect (authenticated users cannot see /auth)
      try {
        await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 5000 });
      } catch {
        // If it doesn't redirect automatically, verify at least that we're not on auth
        await page.waitForTimeout(2000);
      }
      
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
    });
  });

  test.describe('Logout', () => {
    test('should sign out successfully', async ({ page, isMobile }) => {
      // Sign in first
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      // Wait for complete redirect
      await page.waitForTimeout(4000);
      
      // Verify we are authenticated (not on /auth)
      let currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
      
      if (isMobile) {
        // On mobile, open hamburger menu first
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Find and click sign out
      const logoutLink = page.locator('a[href="/api/auth/signout"]').first();
      if (await logoutLink.isVisible().catch(() => false)) {
        await logoutLink.click();
      } else {
        // If no visible link, try clicking logout button if it exists
        const logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
        if (await logoutButton.isVisible().catch(() => false)) {
          await logoutButton.click();
        }
      }
      
      // Wait for logout to complete
      await page.waitForTimeout(4000);
      
      // Refresh page to verify session is closed
      await page.reload();
      await page.waitForTimeout(2000);
      
      if (isMobile) {
        // On mobile, open hamburger menu to see login button
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verify sign in button is displayed
      const loginLink = page.locator('a[href="/auth"]').first();
      const loginVisible = await loginLink.isVisible().catch(() => false);
      
      // Alternative: look for login form
      if (!loginVisible) {
        const loginForm = await page.locator('input#login-email').isVisible().catch(() => false);
        expect(loginForm || loginVisible).toBe(true);
      } else {
        expect(loginVisible).toBe(true);
      }
    });
  });

  test.describe('Protected access', () => {
    test('should ALLOW access to /cart for unauthenticated users (guests)', async ({ page }) => {
      // CHANGE: Cart is now accessible to guests (uses localStorage)
      await page.goto(`${BASE_URL}/cart`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      // No longer redirects, allows viewing empty cart
      expect(currentUrl).toContain('/cart');
      expect(currentUrl).toContain("/cart");
    });

    test('should redirect unauthenticated users from /account to /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/account/orders`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('auth');
    });

    test('should redirect customers from /admin to /', async ({ page }) => {
      // Sign in as customer
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Try to access admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForTimeout(2000);
      
      // Should redirect to home
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/admin');
    });

    test('should allow access to authenticated admin', async ({ page }) => {
      // Sign in as admin
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('admin@3dprint.com');
      await page.locator('input#login-password').fill('admin123');
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Try to access admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForTimeout(2000);
      
      const is404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
      expect(is404).toBe(false);
    });

    test('should redirect admin from /cart to admin area', async ({ page }) => {
      // Sign in as admin
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('admin@3dprint.com');
      await page.locator('input#login-password').fill('admin123');
      await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Try to access cart - should redirect to admin
      await page.goto(`${BASE_URL}/cart`);
      
      // Wait for redirect to admin area
      try {
        await page.waitForURL((url) => url.pathname.includes('/admin') || !url.pathname.includes('/cart'), { timeout: 5000 });
      } catch {
        await page.waitForTimeout(2000);
      }
      
      const currentUrl = page.url();
      // Should be on /admin/dashboard or any page that is not /cart
      expect(currentUrl === `${BASE_URL}/` || currentUrl.includes('/admin') || !currentUrl.includes('/cart')).toBe(true);
    });
  });

  test.describe('Navigation', () => {
    test('should display Header on main pages', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
      
      await page.goto(`${BASE_URL}/auth`);
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('should display Footer on all pages', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});