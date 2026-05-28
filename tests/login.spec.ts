import { test, expect } from '@playwright/test';
import { DashboardPage } from '../src/pages/DashboardPage.js';
import { LoginPage } from '../src/pages/LoginPage.js';

test.describe('Portfolio-ready smoke checks', () => {
  test('home page should load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('primary navigation should be discoverable', async ({ page }) => {
    await page.goto('/');

    const accessibleControl = page.getByRole('link').or(page.getByRole('button')).first();
    await expect(accessibleControl).toBeVisible();
  });
});

test.describe('Login flow examples', () => {
  test.skip(process.env.RUN_AUTH_TESTS !== 'true', 'Set RUN_AUTH_TESTS=true for applications that expose a login flow.');

  test('login page should load', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.expectLoaded();
  });

  test('login with valid credentials', async ({ page }) => {
    test.skip(!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD, 'Set E2E_USERNAME and E2E_PASSWORD to run authenticated login.');

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await dashboardPage.expectLoaded();
  });

  test('show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrong-password');
    await loginPage.expectInvalidCredentialsMessage();
  });

  test('logout successfully', async ({ page }) => {
    test.skip(!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD, 'Set E2E_USERNAME and E2E_PASSWORD to run logout.');

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();
    await expect(page).toHaveURL(/login|signin|\/$/);
  });
});
