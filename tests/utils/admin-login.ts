import { Page, expect } from '@playwright/test';

export async function adminLogin(page: Page) {
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', '123456');
  await page.getByRole('button', { name: 'Sign In' }).first().click();
  await page.waitForURL('/');

  await page.getByText(/Hello, John/).click();

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page).toHaveURL('/admin/overview');
}

export async function regularUserLogin(page: Page) {
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'jane@example.com');
  await page.fill('input[name="password"]', '123456');
  await page.getByRole('button', { name: 'Sign In' }).first().click();
  await page.waitForURL('/');
  await expect(page).toHaveURL('/');
}
