import  { test, expect } from '@playwright/test';

test.describe('Authentication', async () => {
  test('Login', async ({page}) => {
    await page.goto('/');
    await page.getByText('Hello, sign in').click();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page.getByText('Sign In').first()).toBeVisible();
    // Fill in the email address
    await page.fill('input[name="email"]', 'admin@example.com');

    // Fill in the password
    await page.fill('input[name="password"]', '123456');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Hello, John')).toBeVisible();
  });
})
