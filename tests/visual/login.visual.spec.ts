import { test } from '@playwright/test';
import { Eyes, Target } from '@applitools/eyes-playwright';

test.describe('Visual AI checkpoints', () => {
  test('login and dashboard visual checkpoints', async ({ page }) => {
    test.skip(!process.env.APPLITOOLS_API_KEY, 'Set APPLITOOLS_API_KEY to run Applitools visual checks.');

    const eyes = new Eyes();
    eyes.setApiKey(process.env.APPLITOOLS_API_KEY!);

    await eyes.open(page, 'AutomateTestPilotAI', 'Login and dashboard baseline');

    await page.goto('/login');
    await eyes.check('Login page', Target.window().fully());

    await page.goto('/');
    await eyes.check('Dashboard or home page', Target.window().fully());

    await eyes.close();
  });
});
