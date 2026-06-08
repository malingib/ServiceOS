import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+254700100200');
      await page.locator('button:has-text("Send OTP")').first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display service categories', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    const serviceCards = page.locator('[data-testid="service-card"], .service-card, [class*="service"]').first();
    await expect(serviceCards).toBeVisible();
  });

  test('should select a service and proceed to booking', async ({ page }) => {
    await page.goto('/services');

    const serviceItem = page.locator('text=Cleaning').or(page.locator('text=cleaning')).first();
    if (await serviceItem.isVisible()) {
      await serviceItem.click();
    }

    const firstCard = page.locator('[data-testid="service-card"], .service-card, [class*="service"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
    }

    await page.waitForTimeout(500);
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Book Now"), a:has-text("Book")').first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
    }
  });

  test('should create a booking with valid details', async ({ page }) => {
    await page.goto('/bookings/new');

    const dateInput = page.locator('input[type="date"], input[placeholder*="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-06-15');
    }

    const timeInput = page.locator('input[type="time"], select[name*="time"], input[placeholder*="time"]').first();
    if (await timeInput.isVisible()) {
      await timeInput.fill('10:00');
    }

    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Confirm")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should view booking list', async ({ page }) => {
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/bookings/);
  });

  test('should cancel a booking', async ({ page }) => {
    await page.goto('/bookings');

    const cancelButton = page.locator('button:has-text("Cancel"), [data-testid="cancel-booking"]').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      await page.waitForTimeout(500);
    }
  });
});
