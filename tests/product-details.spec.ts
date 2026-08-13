import { test, expect } from '@playwright/test';
import { login } from '../e2e/auth-helper';

test.describe('4.1.2. Product Details', () => {
  const PRODUCT_SLUG = 'nike-mens-slim-fit-long-sleeve-t-shirt'; // A product from lib/data.ts
  const PRODUCT_NAME = 'Nike Mens Slim-fit Long-Sleeve T-Shirt';
  const PRODUCT_BRAND = 'Nike';
  // const PRODUCT_PRICE = '$21.80';
  const PRODUCT_DESCRIPTION =
    'Made with chemicals safer for human health and the environment';

  test('US-1.2.1: Customer wants to view detailed product information', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // (Doc 16)
    await expect(page.locator(`h1:has-text("${PRODUCT_NAME}")`)).toBeVisible();
    await expect(
      page.locator(`p:has-text("Brand ${PRODUCT_BRAND}")`),
    ).toBeVisible();
    await expect(
      page.locator(
        `p.p-medium-16.lg\\:p-regular-18:has-text("${PRODUCT_DESCRIPTION}")`,
      ),
    ).toBeVisible();
    // fix price display
    // await expect(page.locator('div.flex.gap-3 ProductPrice')).toContainText(
    //   PRODUCT_PRICE.substring(1, 2),
    // );
    await expect(page.getByText('$218').first()).toBeVisible();
    await expect(
      page.locator('button img[alt="product image"]').first(),
    ).toBeVisible();
  });

  test('US-1.2.2: Customer wants to see multiple images for a product and click to zoom in', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // (Doc 16, 119)

    // Verify multiple thumbnails
    const thumbnails = page.locator('button img[alt="product image"]');
    await expect(thumbnails).toHaveCount(2); // Based on p11 having 2 images

    // Click second thumbnail
    await thumbnails.nth(1).click();
    // Verify main image changes (check its src or alt)
    const mainImage = page.locator('div.relative.h-\\[500px\\] img');
    await expect(mainImage).toHaveAttribute('src', /p11-2\.jpg/);

    // Test zoom functionality (Doc 119)
    await mainImage.click();
    // data-rmiz-modal-overlay="visible"
    const zoomOverlay = page.locator('div[data-rmiz-modal-overlay]'); // Selector for react-medium-image-zoom overlay
    await expect(zoomOverlay).toBeVisible();
    await page.keyboard.press('Escape'); // Close zoom
    await expect(zoomOverlay).not.toBeVisible();
  });

  test('US-1.2.3: Customer wants to select different colors and sizes for a product', async ({
    page,
  }) => {
    const productWithVariantsSlug =
      'jerzees-long-sleeve-heavyweight-blend-t-shirt'; // Product p12 with colors and sizes (Doc 16, 125)
    await page.goto(`/product/${productWithVariantsSlug}`);

    // Select 'Red' color
    await page.getByRole('link', { name: 'Red', exact: true }).click();
    await page.waitForURL(/color=Red/);
    await expect(
      page.getByRole('link', { name: 'Red', exact: true }),
    ).toHaveClass(/border-primary/); // Check highlight

    // Select 'L' size
    await page.getByRole('link', { name: 'L', exact: true }).click();
    await page.waitForURL(/size=L/);
    await expect(
      // page.locator('div.mt-2.space-x-2.space-y-2 button:has-text("L")
      // '),
      page.getByRole('link', { name: 'L', exact: true }),
    ).toHaveClass(/border-primary/); // Check highlight

    // Verify both are present in URL
    await expect(page).toHaveURL(new RegExp(`color=Red&size=L`));
  });

  // not
  test("US-1.2.4: Customer wants to see the product's price, including any list price and discount", async ({
    page,
  }) => {
    // Product with a list price and discount (todays-deal) (Doc 16, 120)
    const productWithDealSlug = '/asics-mens-gt-2000-13-running-shoes';
    await page.goto(`/product/${productWithDealSlug}`);

    await expect(
      // page.locator('span.bg-red-700:has-text("% Off")'),
      page.getByText('-10%'),
    ).toBeVisible(); // Discount %
    // check Original price is seen and has a line through
    await expect(page.getByText('List price: $200.00')).toBeVisible();
    await expect(page.getByText('$200.00')).toHaveClass('line-through');
    await expect(page.getByText('$17995').first()).toBeVisible(); // Actual price is $179.95 with 95 small superscript
  });

  test("US-1.2.5: Customer wants to view the product's stock status", async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // Product p11 has 11 in stock (Doc 16)
    await expect(
      page.locator('div.text-green-700', { hasText: 'In Stock' }),
    ).toBeVisible();

    await expect(
      page.getByRole('combobox').filter({ hasText: 'Quantity:' }),
    ).toBeVisible();
    await page.getByRole('combobox').filter({ hasText: 'Quantity:' }).click();
    // confirm that 11 items are in stock
    await expect(page.getByRole('option', { name: '11' })).toBeVisible();
    // To test "Out of Stock", a product with `countInStock: 0` would be needed in the seed data.
  });

  test('US-1.2.6: Customer wants to see an average rating and the total number of reviews', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // Product p11 has avgRating: 4.71, numReviews: 7 (Doc 16, 123)
    await expect(
      page.getByRole('button', { name: 'Rating: 4.71 out of 5 stars' }),
    ).toBeVisible(); // The average rating number
    await expect(
      page.locator('a[href="#reviews"]:has-text("7 ratings")'),
      // page.getByRole('link', { name: 'ratings' })
    ).toBeVisible(); // Total reviews count

    // Test popover summary
    await page
      .getByRole('button', { name: 'Rating: 4.71 out of 5 stars' })
      .click(); // Click the popover trigger
    await expect(
      page.locator('div').filter({ hasText: /^4\.7 out of 5$/ }),
    ).toBeVisible();
    await expect(page.getByRole('dialog').getByText('7 ratings')).toBeVisible();
    await page.keyboard.press('Escape'); // Close popover
  });

  test.skip('US-1.2.7: Customer wants to view individual customer reviews', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // Product p11 has reviews (Doc 16, 17)
    await expect(
      page.locator('h2#reviews', { hasText: 'Customer Reviews' }),
    ).toBeVisible();

    // const reviewsContainer = page.locator(
    //   'div.md\\:col-span-3.flex.flex-col.gap-3',
    // );
    const reviewsContainer = page.locator('section:has(h2#reviews)', {
      hasText: 'Customer Reviews',
    });
    await expect(reviewsContainer).toBeVisible();
    // 2. Locate all review cards
    // We identify each review by its distinctive class combination.
    // The selector '.rounded-xl.border.bg-card.text-card-foreground.shadow'
    // targets divs that are individual review containers.
    const allReviewCards = reviewsContainer.locator(
      '.rounded-xl.border.bg-card.text-card-foreground.shadow',
    );

    // 3. Assert that reviews are visible
    // We expect at least one review card to be visible, which confirms the section loaded correctly.
    // Using `first()` ensures we're checking a specific element if multiple exist.
    // await expect(allReviewCards.first()).toBeVisible();
    await reviewsContainer.scrollIntoViewIfNeeded();
    await reviewsContainer
      .locator('.rounded-xl.border.bg-card.text-card-foreground.shadow')
      .first()
      .waitFor({ state: 'visible', timeout: 2000 });
    // 4. Assert the exact number of reviews
    // We count all elements matching our selector and assert that the count is 7.
    await expect(allReviewCards).toHaveCount(7);

    // More specific assertions for individual review content
    await expect(
      reviewsContainer.getByText("Couldn't ask for more!"),
    ).toBeVisible();
    await expect(
      reviewsContainer.getByText('Love this product!'),
    ).toBeVisible();

    await expect(
      reviewsContainer.getByText('This product is outstanding!'),
    ).toBeVisible();
    await expect(reviewsContainer.getByText('Excellent choice!')).toBeVisible();
  });

  test('US-1.2.8: Customer wants to see a rating distribution breakdown', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // Product p11 has rating distribution (Doc 16, 123)
    await expect(
      page.locator('h2#reviews', { hasText: 'Customer Reviews' }),
    ).toBeVisible();

    const ratingSummarySection = page.locator('section:has(h2#reviews)', {
      hasText: 'Customer Reviews',
    });
    await ratingSummarySection.scrollIntoViewIfNeeded();
    await expect(ratingSummarySection.getByText('5 star')).toBeVisible();
    await expect(ratingSummarySection.getByText('4 star')).toBeVisible();
    await expect(ratingSummarySection.getByRole('progressbar')).toHaveCount(5); // For 1 to 5 stars
  });

  test.skip('US-1.2.9: Customer wants to write a review for a product', async ({
    page,
  }) => {
    await login(page, 'jack@example.com', '123456'); // Login as a regular user (Doc 17)

    const productForReviewSlug =
      'casio-classic-silver-tone-stainless-steel-band-date-indicator-watch'; // Product p34
    await page.goto(`/product/${productForReviewSlug}`);
    await expect(
      page.locator('h2#reviews', { hasText: 'Customer Reviews' }),
    ).toBeVisible();

    // Click "Write a customer review"
    await page
      .locator('button', { hasText: 'Write a customer review' })
      .click();

    // Fill the review form (Doc 17)
    await expect(
      page.locator('h2', { hasText: 'Write a customer review' }),
    ).toBeVisible(); // Dialog title
    await page.fill('input[name="title"]', 'Great Watch!');
    await page.fill(
      'textarea[name="comment"]',
      'I really love this watch, it looks great and works perfectly.',
    );
    // Click rating select trigger
    await page.getByRole('combobox', { name: 'Rating' }).click(); // Select 5 stars
    await page.getByRole('option', { name: '5' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success toast message (Doc 17, 100)
    // await expect(page.locator('div[data-radix-toast-viewport]')).toContainText(
    //   'Review created successfully',
    // );

    // Verify the new review appears in the list (wait for revalidation and reload if necessary)
    await page.waitForLoadState('networkidle');
    await page.reload();
    const reviewsContainer = page.locator('section:has(h2#reviews)', {
      hasText: 'Customer Reviews',
    });
    // await expect(
    //   reviewsContainer
    //     .locator('div.Card')
    //     .first()
    //     .locator('div.CardTitle', { hasText: 'Great Watch!' }),
    // ).toBeVisible();
    // await expect(
    //   reviewsContainer
    //     .locator('div.Card')
    //     .first()
    //     .locator('div.CardDescription', {
    //       hasText: 'I really love this watch',
    //     }),
    // ).toBeVisible();
    await expect(async () => {
      await expect(reviewsContainer.getByText('Great Watch!')).toBeVisible();
      await expect(
        reviewsContainer.getByText(/I really love this watch, it/),
      ).toBeVisible();
    }).toPass();
  });

  test('US-1.2.10: Customer wants to see related products from the same category', async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}`); // Product p11 is 'T-Shirts' category (Doc 16, 121)
    await expect(
      page.locator('h2', { hasText: 'Best Sellers in T-Shirts' }),
    ).toBeVisible();

    // Verify that the slider contains product cards
    const relatedProductsSlider = page.locator('section:has(h2)', {
      hasText: 'Best Sellers in T-Shirts',
    });
    await expect(relatedProductsSlider).toBeVisible();
    // Check for specific related products (e.g., other T-Shirts from the data)
    await expect(
      relatedProductsSlider.locator(
        'text="Jerzees Long-Sleeve Heavyweight Blend T-Shirt"',
      ),
    ).toBeVisible();
  });
});
