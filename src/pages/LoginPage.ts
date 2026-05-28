import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.locator('body')).toBeVisible();
    await expect(this.page.getByRole('heading').or(this.page.locator('body')).first()).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel(/email|username/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /log in|login|sign in/i }).click();
  }

  async expectInvalidCredentialsMessage(): Promise<void> {
    await expect(this.page.getByText(/invalid|incorrect|error|required/i).first()).toBeVisible();
  }
}
