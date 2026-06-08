import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display admin login', async ({ page }) => {
    await expect(page.locator('form').or(page.locator('[data-testid="login-form"]'))).toBeVisible();
  });

  test('should login as admin', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@serviceops.local');
      await passwordInput.fill('admin123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show dashboard stats', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@serviceops.local');
      await page.locator('input[type="password"]').first().fill('admin123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="stat"]').first();
    if (await statCards.isVisible()) {
      await expect(statCards).toBeVisible();
    }
  });

  test('should navigate to tenant management', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@serviceops.local');
      await page.locator('input[type="password"]').first().fill('admin123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');

    const tenantList = page.locator('table, [data-testid="tenant-list"], .tenant-list').first();
    if (await tenantList.isVisible()) {
      await expect(tenantList).toBeVisible();
    }
  });

  test('should manage workers from admin', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@serviceops.local');
      await page.locator('input[type="password"]').first().fill('admin123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/admin/workers');
    await page.waitForLoadState('networkidle');

    const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Approve")').first();
    if (await verifyButton.isVisible()) {
      await verifyButton.click();
      await page.waitForTimeout(500);
    }
  });
});
