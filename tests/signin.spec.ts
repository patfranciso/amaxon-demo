import { test, expect } from '@playwright/test';

// Define test credentials based on lib/data.ts (Document 141)
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = '123456';
const TEST_USER_NAME = 'John'; // Name for 'admin@example.com' from lib/data.ts

test.describe('User Authentication', () => {
  test('should allow a customer to sign in with valid email and password', async ({
    page,
  }) => {
    // Navigate to the sign-in page (Document 71)
    await page.goto('/sign-in');

    // Ensure the credentials sign-in form is visible (Document 69)
    // await expect(page.getByText('Sign In')).toBeVisible()

    // Fill in the email address (Document 69)
    await page.fill('input[name="email"]', TEST_EMAIL);

    // Fill in the password (Document 69)
    await page.fill('input[name="password"]', TEST_PASSWORD);

    // Click the "Sign In" button (Document 69)
    await page.click('button:has-text("Sign In")');

    // Assert successful sign-in and redirection
    // Upon successful login, the user should be redirected to the home page (Document 71, 68)
    // await expect(page).toHaveURL('/')

    // Verify the user's name is displayed in the header (Document 132)
    // The header should show "Hello, {username}"
    await expect(page.getByText(`Hello, ${TEST_USER_NAME}`)).toBeVisible();

    // Optionally, check that the sign-in/sign-up options are no longer directly visible
    // and instead, a user menu or similar is present (Document 132)
    // First, we might need to click the user button to expand the menu if it's not always visible
    // The "Hello, John" text itself is part of the dropdown trigger, so its visibility is a good enough check for now.
    await expect(page.getByRole('link', { name: 'Sign In' })).not.toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Create account' }),
    ).not.toBeVisible();
  });

  // You might want to add more tests for:
  // - Invalid credentials (incorrect email/password)
  // - Empty fields submission
  // - Google Sign-In (Document 70) if applicable to the specific test scenario
});
