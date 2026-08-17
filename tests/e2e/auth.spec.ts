import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { DEFAULT_PASSWORD } from '@/lib/constants';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Helper function for logging in
  async function loginAsUser(page: Page, email: string, password: string) {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    // Wait for redirect to home or account page
    await page.waitForURL(
      (url: URL) => url.pathname === '/' || url.pathname === '/account',
    );
    await expect(page.getByText(`Hello, John`)).toBeVisible(); // Assuming name is displayed in header
  }

  // US-1.4.1: As a customer, I want to sign up for a new account using my email and password.
  test('US-1.4.1: Sign up with email and password', async ({ page }) => {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 8 });

    await page.goto('/sign-up');
    await expect(page).toHaveURL(/sign-up/);

    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Expect successful redirection after signup/login
    await page.waitForURL(
      (url) => url.pathname === '/' || url.pathname === '/account',
    );

    // Expect to see the user's name in the header (if logged in automatically after signup)
    await page
      .locator('.header-button')
      .filter({ hasText: 'Account & Orders' })
      .click(); // Open user dropdown
    // await expect(page.getByText(name)).toBeVisible()
    await expect(page.getByText(name)).toHaveCount(2);
    await expect(page.getByText(email)).toBeVisible();
  });

  // US-1.4.2: As a customer, I want to sign in to my existing account using credentials.
  test('US-1.4.2: Sign in with credentials', async ({ page }) => {
    const email = 'admin@example.com'; // Pre-seeded user from lib/data.ts for development
    const password = DEFAULT_PASSWORD;

    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);

    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    // await page.getByRole('button', { name: 'Sign In' }).click()
    await page.getByRole('button', { name: 'Sign In' }).first().click();

    // Expect successful redirection after login
    await page.waitForURL('');
    // await page.waitForURL(
    //   (url) => url.pathname === '/' || url.pathname === '/account',
    // )

    page.getByText(`Hello, John`).click();
    // Expect to see the user's name in the header
    // await page
    //   .locator('.font-bold') //('.header-button')
    //   .filter({ hasText: 'Account & Orders' })
    //   .click() // Open user dropdown
    await expect(page.getByText('Hello, John')).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  // US-1.4.7: As a logged-in user, I want to sign out of my account.
  test('US-1.4.7: Sign out of account', async ({ page }) => {
    const email = 'admin@example.com'; // Pre-seeded user
    const password = DEFAULT_PASSWORD;
    await loginAsUser(page, email, password);

    // Open the user dropdown menu in the header
    await page
      .locator('.header-button')
      .filter({ hasText: 'Account & Orders' })
      .click();

    // Click the "Sign out" button within the dropdown
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Expect to be redirected to the sign-in page
    // await page.waitForURL(/sign-in/)
    await page.waitForURL('');
    await expect(page.locator('a', { hasText: "Today's Deal" })).toBeVisible();

    // Verify "Sign In" is visible in the header, indicating logged out state
    await expect(
      page.locator('.header-button').filter({ hasText: 'Sign in' }),
    ).toBeVisible();
  });
});
