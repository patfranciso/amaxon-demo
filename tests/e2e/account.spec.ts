import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('User Account Features', () => {
  const preSeededUser = {
    email: 'admin@example.com',
    password: '123456',
    name: 'John Dada',
  };

  test.beforeEach(async ({ page }) => {
    // Log in the user before each test
    await page.goto('/sign-in');
    await page.locator('input[name="email"]').fill(preSeededUser.email);
    await page.locator('input[name="password"]').fill(preSeededUser.password);
    await page.getByRole('button', { name: 'Sign In' }).first().click(); //+
    await page.waitForURL(
      (url) => url.pathname === '/' || url.pathname === '/account',
    );
    // Verify successful login
    await page
      .locator('.header-button')
      .filter({ hasText: 'Account & Orders' })
      .click();
    // await expect(page.getByText(preSeededUser.name)).toBeVisible()
  });

  // US-1.4.3: As a logged-in user, I want to view my account dashboard.
  test('US-1.4.3: View account dashboard', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL('/account');
    await expect(page.locator('h1', { hasText: 'Your Account' })).toBeVisible();

    // Check for quick links
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Login & security' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Addresses' })).toBeVisible();
  });

  // US-1.4.4: As a logged-in user, I want to view a list of all my past orders.
  test('US-1.4.4: View list of past orders', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL('/account/orders');
    await expect(page.locator('h1', { hasText: 'Your Orders' })).toBeVisible();

    // Check for the orders table
    const orderTable = page.locator('table');
    await expect(orderTable).toBeVisible();

    // Check for table headers
    await expect(
      orderTable.getByRole('columnheader', { name: 'Id' }).first(),
    ).toBeVisible();
    await expect(
      orderTable.getByRole('columnheader', { name: 'Date' }),
    ).toBeVisible();
    await expect(
      orderTable.getByRole('columnheader', { name: 'Total' }),
    ).toBeVisible();
    await expect(
      orderTable.getByRole('columnheader', { name: 'Paid' }),
    ).toBeVisible();
    await expect(
      orderTable.getByRole('columnheader', { name: 'Delivered' }),
    ).toBeVisible();
    await expect(
      orderTable.getByRole('columnheader', { name: 'Actions' }),
    ).toBeVisible();

    // Check if there's at least one order displayed (assuming seeded data)
    const orderRows = page.locator('table tbody tr');
    await expect(orderRows.first()).toBeVisible();
    await expect(orderRows.first().locator('td').nth(0)).toHaveText(/..\w{6}/); // Checks for format like "..abcde1"
  });

  // US-1.4.5: As a logged-in user, I want to view the detailed information of a specific order.
  test('US-1.4.5: View detailed information of a specific order', async ({
    page,
  }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL('/account/orders');

    // Click on the "Details" link for the first order
    await page
      .locator('table tbody tr')
      .first()
      .getByRole('link', { name: 'Details' })
      .click();

    // Expect to be on the order details page
    await page.waitForURL(/\/account\/orders\/\w+$/);
    await expect(page.locator('h1', { hasText: 'Order' })).toBeVisible();

    // Verify sections and their content
    await expect(
      page.getByRole('heading', { name: 'Shipping Address', level: 2 }),
    ).toBeVisible();
    await expect(page.locator('text=John').first()).toBeVisible(); // From pre-seeded user address

    await expect(
      page.getByRole('heading', { name: 'Payment Method', level: 2 }),
    ).toBeVisible();
    await expect(page.locator('text=Stripe').first()).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Order Items', level: 2 }),
    ).toBeVisible();
    // Check if at least one item is listed
    await expect(
      page.locator('table').filter({ hasText: 'ItemQuantityPrice' }),
    ).toBeVisible();
    await expect(
      page.locator('table tbody tr').first().locator('td').nth(0),
    ).toBeVisible(); // First item name
  });

  // US-1.4.6: As a logged-in user, I want to edit my name in the "Login & Security" section.
  test.skip('US-1.4.6: Edit name in "Login & Security" section', async ({
    page,
  }) => {
    const newName = faker.person.fullName();

    await page.goto('/account/manage');
    await expect(page).toHaveURL('/account/manage');
    await expect(
      page.locator('h1', { hasText: 'Login & Security' }),
    ).toBeVisible();

    // Click the "Edit" button next to Name
    // await page.locator('div:has-text("Name") >> button[name="Edit"]').click()
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Expect to be on the name edit page
    await expect(async () => {
      await expect(page.url()).toContain('/account/manage');
    }).toPass();
    await expect(
      page.locator('h1', { hasText: 'Change Your Name' }),
    ).toBeVisible();

    // Fill in the new name
    const nameInput = page.getByLabel('New name');
    await expect(nameInput).toHaveValue('John'); // Check default value
    await nameInput.fill(newName);

    // Submit the form
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Expect a success toast message
    // await expect(page.locator('div[data-radix-toast-provider]')).toContainText(
    //   'User updated successfully',
    // )

    // Expect to be redirected back to the manage page
    await page.waitForURL('/account/manage');

    // Verify the updated name is displayed
    await expect(page.locator('div:has-text("Name")').first()).toContainText(
      newName,
    );

    // Verify name updated in header as well
    await page
      .locator('.header-button')
      .filter({ hasText: 'Account & Orders' })
      .click(); // Open user dropdown
    await expect(page.getByText(newName)).toBeVisible();
    await expect(page).toHaveURL('/account/manage');
    await expect(
      page.locator('h1', { hasText: 'Login & Security' }),
    ).toBeVisible();

    // OPTIONAL: Restore original name to keep test state clean if needed
    // await page.locator('div:has-text("Name") >> button[name="Edit"]').click()
    await page.locator('html').click(); // fix for playwright bug
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByLabel('New name').fill(preSeededUser.name);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    // await expect(page.locator('div[data-radix-toast-provider]')).toContainText(
    //   'User updated successfully',
    // )
    await page.waitForURL('/account/manage');
    await expect(page.locator('div:has-text("Name")').first()).toContainText(
      preSeededUser.name,
    );
  });
});
