import { test, expect } from '@playwright/test';
import { adminLogin } from '../utils/admin-login';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  // US-2.5.1: As an administrator, I want to view a paginated list of all registered users.
  test.skip('should display a paginated list of all registered users', async ({
    page,
  }) => {
    // Check pagination controls
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();

    // Click next page
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    await expect(page.url()).toContain('page=2');

    // Verify table content
    await expect(page.getByRole('columnheader', { name: 'Id' })).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Email' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Role' }),
    ).toBeVisible();
  });

  // US-2.5.2: As an administrator, I want to edit a user's name, email, and role (Admin/User).
  test.skip("should allow editing a user's name, email, and role", async ({
    page,
  }) => {
    // Find a user to edit (e.g., 'Jane' from seed data)
    await page
      // .getByRole('row', { name: /jane@example.com/i })
      .getByRole('row', { name: /Stephan.Bernhard86@gmail.com/i })
      .getByRole('link', { name: 'Edit' })
      .first()
      .click();
    await page.waitForURL(/\/admin\/users\/.*/);

    await expect(page.locator('input[name="name"]')).toHaveValue(
      'Ethel Goldner',
    );
    await expect(page.locator('input[name="email"]')).toHaveValue(
      'Stephan.Bernhard86@gmail.com',
    );
    // await expect(
    //   page.locator('div[role="combobox"]').getByText('User'),
    // ).toBeVisible() // Check current role
    await expect(page.getByRole('combobox', { name: 'Role' })).toHaveText(
      'User',
    ); // Check current role
    // Modify details
    await page.fill('input[name="name"]', 'Jane Doe Updated');
    await page.fill('input[name="email"]', 'jane.doe.updated@example.com');

    // Change role
    // await page.locator('div[role="combobox"]').getByText('User').click()
    await page.getByRole('combobox', { name: 'Role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();

    await page.getByRole('button', { name: 'Update User' }).click();

    await expect(page).toHaveURL('/admin/users');
    // await expect(page.getByText('User updated successfully')).toBeVisible()
    await expect(
      page.getByRole('cell', { name: 'Jane Doe Updated' }),
    ).toBeVisible();
    await expect(
      page.getByRole('cell', { name: 'jane.doe.updated@example.com' }),
    ).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Admin' })).toBeVisible();

    // Revert changes for subsequent tests if necessary
    await page
      .getByRole('row', { name: /jane.doe.updated@example.com/i })
      .getByRole('link', { name: 'Edit' })
      .click();
    await page.waitForURL(/\/admin\/users\/.*/);
    await page.fill('input[name="name"]', 'Jane');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.locator('div[role="combobox"]').getByText('Admin').click();
    await page.getByRole('option', { name: 'User' }).click();
    await page.getByRole('button', { name: 'Update User' }).click();
    await expect(page.getByText('User updated successfully')).toBeVisible();
  });

  // US-2.5.3: As an administrator, I want to delete a user.
  test.skip('should allow deleting a user', async ({ page }) => {
    // Find a user to delete (e.g., 'Jack' from seed data)
    const userEmailToDelete = 'jack@example.com';
    const userIdCell = page
      .getByRole('row', { name: new RegExp(userEmailToDelete, 'i') })
      .getByRole('cell')
      .first();
    const userId = await userIdCell.textContent();

    await page
      .getByRole('row', { name: new RegExp(userEmailToDelete, 'i') })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click(); // Confirm in dialog

    await expect(page.getByText('User deleted successfully')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: userId || '' }),
    ).not.toBeVisible();
  });
});
