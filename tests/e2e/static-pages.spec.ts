import { test, expect } from '@playwright/test';

test.describe('Static Pages', () => {
  const baseURL = 'http://localhost:3001';
  // US-1.4.8: As a customer, I want to view static information pages.
  const staticPages = [
    {
      slug: 'about-us',
      title: 'About Us',
      contentExcerpt: 'Welcome to [Your Store Name]',
    },
    {
      slug: 'contact-us',
      title: 'Contact Us',
      contentExcerpt: 'We’re here to help!',
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      contentExcerpt: 'We value your privacy',
    },
    {
      slug: 'help',
      title: 'Help',
      contentExcerpt: 'Welcome to our Help Center!',
    },
    {
      slug: 'conditions-of-use',
      title: 'Conditions of Use',
      contentExcerpt: 'By accessing or using our website',
    },
    {
      slug: 'customer-service',
      title: 'Customer Service',
      contentExcerpt: 'our customer service team is here to ensure',
    },
    {
      slug: 'returns-policy',
      title: 'Returns Policy',
      contentExcerpt: 'Returns Policy Content',
    }, // This one is very generic
  ];

  for (const pageInfo of staticPages) {
    test(`US-1.4.8: View static page: ${pageInfo.title}`, async ({ page }) => {
      await page.goto(`${baseURL}/page/${pageInfo.slug}`);
      await expect(page).toHaveURL(`${baseURL}/page/${pageInfo.slug}`);
      await expect(
        page.locator('h1', { hasText: pageInfo.title }),
      ).toBeVisible();
      await expect(page.locator('.web-page-content')).toContainText(
        pageInfo.contentExcerpt,
      );
    });
  }
});
