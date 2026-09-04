import { expect, test } from '@playwright/test';

test('renders the application shell without horizontal overflow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Найди того, кто уже проходил через это/i })).toBeVisible();
  await expect(page.getByText('Сферы сообщества')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('base navigation routes render', async ({ page, isMobile }) => {
  await page.goto('/');

  if (isMobile) {
    await page.getByRole('navigation', { name: 'Мобильная навигация' }).getByText('Мои братья').click();
  } else {
    await page.getByRole('navigation', { name: 'Основная навигация' }).getByText('Мои братья').click();
  }

  await expect(page.getByRole('heading', { name: 'Мои братья' })).toBeVisible();
  await expect(page).toHaveURL(/\/brothers$/);
});
