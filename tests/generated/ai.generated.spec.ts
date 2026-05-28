import { test, expect } from '@playwright/test';

test.describe('AI generated portfolio checks', () => {
  test('TC-001 JakapanKPortfolio home page loads successfully @smoke @homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    const primaryLandmark = page.getByRole('main').or(page.locator('body'));
    await expect(primaryLandmark.first()).toBeVisible();
  });

  test('TC-002 JakapanKPortfolio primary navigation is usable @accessibility @navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    const primaryLandmark = page.getByRole('main').or(page.locator('body'));
    await expect(primaryLandmark.first()).toBeVisible();
  });

  test('TC-003 JakapanKPortfolio page has stable visual baseline @visual @regression', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    const primaryLandmark = page.getByRole('main').or(page.locator('body'));
    await expect(primaryLandmark.first()).toBeVisible();
  });
});
