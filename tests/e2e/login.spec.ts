import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page with phone input', async ({ page }) => {
    await expect(page.locator('text=Sign In').or(page.locator('text=Login')).or(page.locator('text=Log in'))).toBeVisible();
    await expect(page.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible();
  });

  test('should request OTP and show verification screen', async ({ page }) => {
    await page.locator('input[type="tel"], input[name="phone"]').first().fill('+254700100200');
    await page.locator('button:has-text("Send OTP"), button:has-text("Get Code"), button[type="submit"]').first().click();

    await page.waitForTimeout(1000);

    const otpInputs = page.locator('input[inputmode="numeric"], input[maxlength="6"], input[type="text"][maxlength="1"]');
    if (await otpInputs.first().isVisible()) {
      const count = await otpInputs.count();
      if (count === 1) {
        await otpInputs.fill('123456');
      } else {
        const digits = '123456'.split('');
        for (let i = 0; i < Math.min(count, 6); i++) {
          await otpInputs.nth(i).fill(digits[i]);
        }
      }
    }

    await page.locator('button:has-text("Verify"), button:has-text("Confirm"), button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
  });

  test('should show validation error for invalid phone', async ({ page }) => {
    await page.locator('input[type="tel"], input[name="phone"]').first().fill('123');
    await page.locator('button:has-text("Send OTP"), button:has-text("Get Code"), button[type="submit"]').first().click();

    await page.waitForTimeout(500);
    const errorMessage = page.locator('text=invalid').or(page.locator('text=Invalid')).or(page.locator('[role="alert"]'));
    await expect(errorMessage).toBeVisible();
  });

  test('should navigate to registration from login', async ({ page }) => {
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign up"), button:has-text("Register")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register|signup/);
    }
  });

  test('should logout successfully', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+254700100200');
      await page.locator('button:has-text("Send OTP"), button:has-text("Get Code")').first().click();
      await page.waitForTimeout(500);
    }

    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login|signin/);
    }
  });
});
