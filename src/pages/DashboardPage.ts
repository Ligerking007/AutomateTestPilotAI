import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.locator('body')).toBeVisible();
    await expect(this.page.getByRole('main').or(this.page.locator('body')).first()).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: /logout|log out|sign out/i }).click();
  }
}
