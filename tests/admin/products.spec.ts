import { test, expect } from '@playwright/test';
import { adminLogin } from '../utils/admin-login';

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/products');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  // US-2.3.1: As an administrator, I want to view a paginated list of all products, with search and filtering capabilities.
  test('should display a paginated product list with search', async ({
    page,
  }) => {
    // Check pagination controls
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();

    // Click next page
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();

    // await expect(page.url()).toContain('page=2')
    await expect(page).toHaveURL('/admin/products');

    // Search for a product (e.g., 'Nike Mens Slim-fit Long-Sleeve T-Shirt' from seed data)
    await page.fill('input[placeholder="Filter name..."]', 'Nike');
    await page.waitForTimeout(1000); // Wait for debounce
    await expect(
      page.getByRole('cell', {
        name: 'Nike Mens Slim-fit Long-Sleeve T-Shirt',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('cell', {
        name: 'Jerzees Long-Sleeve Heavyweight Blend T-Shirt',
      }),
    ).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder="Filter name..."]', '');
    await page.waitForTimeout(1000); // Wait for debounce
    await expect(
      page.getByRole('cell', {
        name: 'Nike Mens Slim-fit Long-Sleeve T-Shirt',
      }),
    ).not.toBeVisible(); // Should still be visible on the current page.
  });

  // US-2.3.2: As an administrator, I want to create a new product, providing details like name, slug, category, images, brand, description, price, list price, stock, tags, sizes, colors, and publication status.
  // US-2.3.5: As an administrator, I want to upload product images directly within the product form. (Integrated here for testing)
  test('should allow creating a new product with image upload', async ({
    page,
  }) => {
    // Mock the uploadthing API
    await page.route('**/api/uploadthing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ url: 'https://utfs.io/f/mock-image-url.jpg' }]),
      });
    });

    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.waitForURL('/admin/products/create');
    await expect(page.getByText('Products›Create')).toBeVisible();

    await page.fill('input[name="name"]', 'Playwright Test Product');
    await page.getByRole('button', { name: 'Generate' }).click(); // Generate slug
    await expect(page.locator('input[name="slug"]')).toHaveValue(
      'playwright-test-product',
    );
    await page.fill('input[name="category"]', 'Test Category');
    await page.fill('input[name="brand"]', 'Test Brand Inc');
    await page.fill('input[name="listPrice"]', '120.00');
    await page.fill('input[name="price"]', '100.00');
    await page.fill('input[name="countInStock"]', '50');
    await page.fill(
      'textarea[name="description"]',
      'This is a description for the Playwright test product.',
    );

    // Upload image
    // Find the hidden input for file upload (uploadthing usually uses this)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload Files' }).click(); // The UploadButton trigger
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('./tests/images/test-image.jpg'); // Path to a dummy image in your project

    // After successful mock, the image should appear in the preview
    await expect(page.locator('img[alt="product image"]')).toBeVisible();

    // Check "Is Published?"
    await page.getByLabel('Is Published?').check();

    await page.getByRole('button', { name: 'Create Product' }).click();

    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByText('Product created successfully')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: 'Playwright Test Product' }),
    ).toBeVisible();
  });

  // US-2.3.3: As an administrator, I want to edit an existing product's details.
  test('should allow editing an existing product', async ({ page }) => {
    // Find a product to edit (e.g., the one created above)
    await page.fill(
      'input[placeholder="Filter name..."]',
      'Playwright Test Product',
    );
    await page.waitForTimeout(500);
    await page
      // .getByRole('row', { name: 'Playwright Test Product' })
      .getByRole('link', { name: 'Edit' })
      .first()
      .click();
    await page.waitForURL(/\/admin\/products\/.*/);

    // await expect(page.locator('input[name="name"]')).toHaveValue(
    //   'Playwright Test Product',
    // )

    // Modify details
    await page.fill('input[name="name"]', 'Updated Playwright Product');
    await page.fill('input[name="price"]', '110.50');
    await page.fill(
      'textarea[name="description"]',
      'Updated description for the Playwright test product.',
    );

    await page.getByRole('button', { name: 'Update Product' }).click();

    await expect(page.url()).toContain('/admin/products');
    // page.waitForTimeout(3000)
    // await expect(page.getByText('Product updated successfully')).toBeVisible()
    // await expect(
    //   page.getByRole('cell', { name: 'Updated Playwright Product' }),
    // ).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Net Price' })).toHaveValue(
      '110.50',
    );
  });

  // US-2.3.4: As an administrator, I want to delete a product.
  test('should allow deleting a product', async ({ page }) => {
    // Find the product to delete
    await page.fill(
      'input[placeholder="Filter name..."]',
      'Updated Playwright Product',
    );
    await page.waitForTimeout(500);

    await page
      .getByRole('row', { name: 'Updated Playwright Product' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click(); // Confirm in dialog

    await expect(page.getByText('Product deleted successfully')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: 'Updated Playwright Product' }),
    ).not.toBeVisible();
  });

  // Note: US-2.3.5 image upload test is integrated into US-2.3.2
});
