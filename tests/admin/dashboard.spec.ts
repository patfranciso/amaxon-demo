import { test, expect } from '@playwright/test';
import { adminLogin } from '../utils/admin-login';

test.describe('Admin Dashboard & Reporting', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/overview');
    await expect(page).toHaveURL('/admin/overview');
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  // US-2.2.1: As an administrator, I want to view an overview dashboard with key metrics such as total revenue, sales count, customer count, and product count.
  test('should display key metrics in the overview dashboard', async ({
    page,
  }) => {
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Total Revenue' })
        .locator('div')
        .nth(1),
    ).toBeVisible(); // Check for actual value

    // await expect(page.getByText('Sales')).toBeVisible()

    await expect(page.getByText('Sales', { exact: true })).toBeVisible();
    await expect(
      page.locator('div').filter({ hasText: 'Sales' }).locator('div').nth(1),
    ).toBeVisible(); // Check for actual value

    await expect(page.getByText('Customers', { exact: true })).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Customers' })
        .locator('div')
        .nth(1),
    ).toBeVisible(); // Check for actual value

    await expect(page.getByText('Products').nth(2)).toBeVisible();
    await expect(
      page.locator('div').filter({ hasText: 'Products' }).locator('div').nth(1),
    ).toBeVisible(); // Check for actual value
  });

  // US-2.2.2: As an administrator, I want to filter dashboard reports by date range.
  test('should allow filtering dashboard reports by date range', async ({
    page,
  }) => {
    // Open the date picker
    await page
      // .getByRole('button', {
      //   name: /Pick a date|^\d{1,2}\/\d{1,2}\/\d{4} - \d{1,2}\/\d{1,2}\/\d{4}$/,
      // })
      // Nov 1, 2025 - Dec 1,
      .getByRole('button', {
        name: /^\w{3} \d{1,2}, \d{4} - \w{3} \d{1,2}, \d{4}$/,
      })
      .click();

    // Select a date range (e.g., last 7 days from today)
    // For simplicity, select two days in the past and today
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    await page
      .getByRole('gridcell', { name: twoDaysAgo.getDate().toString() })
      .first()
      .click();
    await page
      .getByRole('gridcell', { name: today.getDate().toString() })
      .first()
      .click();

    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify loading state and then content update (hard to assert exact numbers)
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
    // After applying, the date button should show the selected range.
    await expect(
      page.getByRole('button', {
        // name: /^\d{1,2}\/\d{1,2}\/\d{4} - \d{1,2}\/\d{1,2}\/\d{4}$/,
        name: /^\w{3} \d{1,2}, \d{4} - \w{3} \d{1,2}, \d{4}$/,
      }),
    ).toBeVisible();
  });

  // US-2.2.3: As an administrator, I want to see a sales overview chart to visualize sales trends over time.
  test('should display the sales overview chart', async ({ page }) => {
    // The chart usually renders as a <svg> or inside a specific container
    // Check for the presence of the chart container or a known element within it
    await expect(page.getByText('Sales Overview')).toBeVisible();
    await expect(
      page.locator('.recharts-curve').first(),
      // page.locator('div.recharts-responsive-container'),
    ).toBeVisible(); // Recharts container
  });

  // US-2.2.4: As an administrator, I want to view monthly sales and product performance tables.
  test('should display monthly sales and product performance tables', async ({
    page,
  }) => {
    await expect(
      // page.getByRole('heading', { name: 'How much you’re earning' }),
      page.getByText('How much you’re earning'),
    ).toBeVisible();
    await expect(
      // page.getByRole('heading', { name: 'Product Performance' }),
      page.getByText('Product Performance'),
    ).toBeVisible();

    // Check for table structure within these cards
    await expect(
      // page.locator(
      //   'h2:has-text("How much you’re earning") + p + div > div > div > div:first-child',
      // ),
      // page.locator('div:nth-child(2) > .relative > .bg-primary').first(),
      page.locator('.relative').first(), // at least last month's data
      // page.getByText(/^\w+\$/),
    ).toBeVisible(); // First label in monthly sales
    await expect(page.getByText('Product Performance')).toBeVisible(); // First label in product performance
  });

  // US-2.2.5: As an administrator, I want to see a pie chart of best-selling categories.
  test('should display a pie chart of best-selling categories', async ({
    page,
  }) => {
    await expect(page.getByText('Best-Selling Categories')).toBeVisible();
    await expect(page.locator('.recharts-sector').first()).toBeVisible(); // Wrapper for the pie chart
  });

  // US-2.2.6: As an administrator, I want to view a list of recent sales (latest orders).
  test('should display a list of recent sales', async ({ page }) => {
    await expect(page.getByText('Recent Sales')).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .getByRole('columnheader', { name: 'Buyer' }),
    ).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .getByRole('columnheader', { name: 'Date' }),
    ).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .getByRole('columnheader', { name: 'Total' }),
    ).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .getByRole('columnheader', { name: 'Actions' }),
    ).toBeVisible();
    // Expect at least one row if there are recent sales
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .getByRole('row')
        .nth(1),
    ).toBeVisible();
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .locator('tbody > tr'),
    ).toHaveCount(9);
    await expect(
      page
        .locator('div')
        .filter({ hasText: 'Recent Sales' })
        .locator('tr:nth-child(9) > td:nth-child(4)'),
    ).toBeVisible();
  });
});
