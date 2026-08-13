import { Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

export async function login(
  page: Page,
  email = 'admin@example.com',
  password = '123456',
) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to homepage or specific callback URL
  await page.waitForURL(`${BASE_URL}/*`); // Allows for redirects to '/', or other pages based on callbackUrl
  // Verify user is logged in by checking "Hello, User Name" text in the header
  await expect(page.locator('span:has-text("Hello,")').first()).toBeVisible();
}

export async function logout(page: Page) {
  await page.goto(BASE_URL); // Ensure on a page with header
  // Open user dropdown
  await page
    .locator('div.flex.gap-2.items-center button.header-button')
    .click(); // Adjust selector if needed
  // Click Sign out button
  await page.locator('form button:has-text("Sign out")').click();
  await page.waitForURL(`${BASE_URL}/sign-in`);
  await expect(page.locator('h2', { hasText: 'Sign In' })).toBeVisible();
}
