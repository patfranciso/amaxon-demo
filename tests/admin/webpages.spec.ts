import { test, expect } from '@playwright/test';
import { adminLogin } from '../utils/admin-login';

test.describe.serial('Admin Web Page Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/web-pages');
    await expect(page).toHaveURL('/admin/web-pages');
    await expect(
      page.getByRole('heading', { name: 'Web Pages' }),
    ).toBeVisible();
  });

  // US-2.6.1: As an administrator, I want to view a list of all static web pages.
  test('should display a list of all static web pages', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Id' })).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Slug' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'IsPublished' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Actions' }),
    ).toBeVisible();
    // Expect at least one row from seeded data (e.g., 'About Us')
    await expect(page.getByRole('cell', { name: 'About Us' })).toBeVisible();
  });

  // US-2.6.2: As an administrator, I want to create a new web page, providing a title, slug, content (using a Markdown editor), and publication status.
  test('should allow creating a new web page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create WebPage' }).click();
    await page.waitForURL('/admin/web-pages/create');
    await expect(
      page.getByRole('heading', { name: 'Create WebPage' }),
    ).toBeVisible();
    await page
      .getByRole('textbox', { name: 'Title' })
      .fill('Playwright Test Page');

    await page.getByRole('button', { name: 'Generate' }).click(); // Generate slug
    await expect(page.locator('input[name="slug"]')).toHaveValue(
      'playwright-test-page',
    );

    // Interact with Markdown editor (assuming it's a textarea or a contenteditable div)
    // The editor has an iframe or complex structure usually, but based on Doc 39, it's `MdEditor` from `react-markdown-editor-lite`.
    // It takes a `renderHTML` prop. The actual input might be a textarea.
    await page.fill(
      'textarea[name="content"]',
      '## This is a test page content in Markdown.',
    );

    await page.getByLabel('Is Published?').check();

    await page.getByRole('button', { name: 'Create Page' }).click();

    await expect(page).toHaveURL('/admin/web-pages/create');
    // await expect(page.getByText('WebPage created successfully')).toBeVisible()
    await expect(
      page.getByRole('cell', { name: 'Playwright Test Page' }),
    ).toBeVisible();
  });

  // US-2.6.3: As an administrator, I want to edit an existing web page's details.
  test('should allow editing an existing web page', async ({ page }) => {
    // Find the created page and click edit
    await page
      .getByRole('row', { name: 'Playwright Test Page' })
      .getByRole('link', { name: 'Edit' })
      .first()
      .click();
    await page.waitForURL(/\/admin\/web-pages\/.*/);

    await expect(page.locator('input[name="title"]')).toHaveValue(
      'Playwright Test Page',
    );

    // Modify details
    await page.fill('input[name="title"]', 'Updated Playwright Test Page');

    await page.fill(
      'textarea[name="content"]',
      '## This is updated test page content.',
    );

    await page.getByRole('button', { name: 'Update Page' }).click();

    await expect(page.url()).toContain('/admin/web-pages');
    // await expect(page.getByText('WebPage updated successfully')).toBeVisible()
    await expect(
      page.getByRole('cell', { name: 'Updated Playwright Test Page' }),
    ).toBeVisible();
  });

  // US-2.6.4: As an administrator, I want to delete a web page.
  test('should allow deleting a web page', async ({ page }) => {
    // Find the updated page and delete it
    const pageTitleToDelete = 'Updated Playwright Test Page';
    const pageIdCell = page
      .getByRole('row', { name: pageTitleToDelete })
      .getByRole('cell')
      .first();
    const pageId = await pageIdCell.textContent();

    await page
      .getByRole('row', { name: pageTitleToDelete })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click(); // Confirm in dialog

    // await expect(page.getByText('WebPage deleted successfully')).toBeVisible()
    await expect(
      page.getByRole('cell', { name: pageId || '' }),
    ).not.toBeVisible();
  });
});
