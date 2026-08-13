import { test, expect } from '@playwright/test';
import { adminLogin, regularUserLogin } from '../utils/admin-login';

test.describe('Admin Authentication & Authorization', () => {
  // US-2.1.1: As an administrator, I want to log in using credentials with "Admin" role to access the admin panel.
  test('should allow admin to log in and access the admin panel', async ({
    page,
  }) => {
    await adminLogin(page);
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  // US-2.1.2: As an administrator, I should only be able to access protected admin routes.
  test('should redirect unauthenticated users from admin routes to sign-in page', async ({
    page,
  }) => {
    await page.goto('/admin/overview');
    // await page.waitForURL('/sign-in?callbackUrl=/admin/overview')
    await page.waitForURL('/sign-in?callbackUrl=**');
    await expect(page).toHaveURL(/sign-in/);
    // await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText('Sign In').first()).toBeVisible();
  });

  test('should prevent non-admin users from accessing admin routes', async ({
    page,
  }) => {
    await regularUserLogin(page); // Log in as a regular user
    await page.goto('/admin/overview');
    // Expecting to land on an error page or a redirect for unauthorized access
    // Based on `app/admin/overview/page.tsx` and `app/admin/users/page.tsx`, it throws an error.
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await expect(page.getByText('Admin permission required')).toBeVisible();
  });

  test('should allow admin users to access protected admin routes', async ({
    page,
  }) => {
    await adminLogin(page); // Log in as admin
    await page.goto('/admin/products'); // Navigate to another admin route
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });
});
