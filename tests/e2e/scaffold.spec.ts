import { expect, test } from '@playwright/test';

test('canonical home renders without overflow and keeps approved proportions', async ({ page }, testInfo) => {
  await page.goto('/');

  const heroImage = page.getByRole('img', { name: /Старший Брат — найдите своего человека в сообществе/i });
  await expect(heroImage).toBeVisible();
  await expect(page.getByText('Сферы сообщества')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Поиск' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const hero = await page.locator('.hero--approved').boundingBox();
  const search = await page.locator('.search-bridge').boundingBox();
  const dashboard = await page.locator('.dashboard-grid').boundingBox();
  const favorites = await page.locator('.favorites-strip').boundingBox();
  const insights = await page.locator('.insight-grid').boundingBox();

  expect(hero).not.toBeNull();
  expect(search).not.toBeNull();
  expect(dashboard).not.toBeNull();
  expect(favorites).not.toBeNull();
  expect(insights).not.toBeNull();

  if (hero && search && dashboard && favorites && insights) {
    if (testInfo.project.name === 'desktop-chromium') {
      expect(hero.height).toBeGreaterThanOrEqual(190);
      expect(hero.height).toBeLessThanOrEqual(300);
      expect(search.width).toBeGreaterThanOrEqual(hero.width * 0.62);
      expect(dashboard.y - (search.y + search.height)).toBeGreaterThanOrEqual(8);
      expect(favorites.y - (dashboard.y + dashboard.height)).toBeGreaterThanOrEqual(12);
      expect(insights.y - (favorites.y + favorites.height)).toBeGreaterThanOrEqual(12);
    } else {
      expect(hero.height).toBeLessThanOrEqual(270);
      expect(search.width).toBeGreaterThanOrEqual(330);
    }
  }

  await page.screenshot({ path: `test-results/visual-${testInfo.project.name}.png`, fullPage: true });
});

test('base navigation routes render', async ({ page }) => {
  await page.goto('/');

  const isMobileViewport = (page.viewportSize()?.width ?? 1440) <= 900;
  const navigationName = isMobileViewport ? 'Мобильная навигация' : 'Основная навигация';

  await page.getByRole('navigation', { name: navigationName }).getByText('Мои братья').click();

  await expect(page.getByRole('heading', { name: 'Мои братья' })).toBeVisible();
  await expect(page).toHaveURL(/\/brothers$/);
});
