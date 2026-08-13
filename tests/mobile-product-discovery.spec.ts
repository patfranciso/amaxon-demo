import { test, expect, devices } from '@playwright/test';

const Pixel5 = devices['Pixel 5'];

test.use({ ...Pixel5 });
test.describe('Mobile: 4.1.1. Product Discovery & Browsing', () => {
  test('US-1.1.5a: Customer on Mobile device wants to apply filters and sort options on the search results page', async ({
    page,
  }) => {
    await page.goto('/search?q=all'); // Start with a broad search (Doc 18)

    // Apply category filter (Doc 18)
    await page.locator('button', { hasText: 'Filters' }).click(); // Open filters on mobile if needed (CollapsibleOnMobile)
    await page.locator('div.space-y-4 ul li a:has-text("T-Shirts")').click();
    await page.waitForURL(/category=T-Shirts/);
    // await expect(page.locator('text="Category: T-Shirts"')).toBeVisible();
    await expect(page.getByText('1-6 of 6 results for Category')).toBeVisible();

    // Apply price filter (Doc 18)
    await page.locator('button', { hasText: 'Filters' }).click(); // Re-open filters if closed
    await page.locator('div.space-y-4 ul li a:has-text("$1 to $20")').click();
    await page.waitForURL(/price=1-20/);
    await expect(page.getByText('Price: 1-20')).toBeVisible();

    // Apply rating filter (Doc 18)
    await page.locator('button', { hasText: 'Filters' }).click(); // Re-open filters if closed
    await page.locator('div.space-y-4 ul li a:has-text("& Up")').click(); // 4 & Up
    await page.waitForURL(/rating=4/);

    // Apply sort option (Avg. customer review) (Doc 18, 122)
    await page
      //   .locator('div.flex-between.flex-col.md\\:flex-row div.relative select')
      .getByRole('combobox')
      .filter({ hasText: 'Sort By: Best selling' })
      .click();
    page.getByText('Avg. customer review').click(); // Click sort trigger (select element)
    await page.waitForURL(/sort=avg-customer-review/);
  });
});
