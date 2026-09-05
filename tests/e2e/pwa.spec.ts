import { expect, test } from '@playwright/test';

const fixture = '<div class="message default" id="message101"><div class="body"><div class="from_name">Леонид Цветков</div><div class="text">1. Леонид Цветков<br>2. Москва<br>3. 33 года<br>4. Производство<br>8. Помогу с продажами</div></div></div>';

test('PWA installs its shell and preserves profiles across offline launches', async ({ page, context }) => {
  await page.goto('/import');
  await page.locator('input[type=file]').setInputFiles({name:'messages.html',mimeType:'text/html',buffer:Buffer.from(fixture)});
  await page.getByRole('button', {name:'Перейти на главную'}).click();
  await page.getByRole('combobox', {name:'Введите своё имя'}).fill('Леонид');
  await page.getByRole('option').first().click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((icon: {sizes:string}) => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some((icon: {sizes:string}) => icon.sizes === '512x512')).toBe(true);
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  // Playwright's isolated test contexts are incognito; that browser policy is not an app defect.
  expect(installability.installabilityErrors.filter(error => error.errorId !== 'in-incognito')).toEqual([]);
  await context.setOffline(true);
  await page.goto('/find?q=Леонид');
  await expect(page.locator('.profile-card__title')).toHaveText('Леонид Цветков');
  await page.goto('/');
  await expect(page.locator('.self-selected')).toContainText('Леонид Цветков');
  await page.reload();
  await expect(page.locator('.self-selected')).toContainText('Леонид Цветков');
  await context.setOffline(false);
});

test('action icons are centered and retain their intrinsic dimensions', async ({ page }) => {
  await page.goto('/import');
  await page.locator('input[type=file]').setInputFiles({name:'messages.html',mimeType:'text/html',buffer:Buffer.from(fixture)});
  await page.getByRole('button', {name:'Перейти на главную'}).click();
  await page.goto('/find?q=Леонид');
  await expect(page.locator('.copy-name')).toBeVisible();
  const offsets = await page.locator('.copy-name, .icon-button').evaluateAll(buttons => buttons.filter(button => button.getBoundingClientRect().width > 0).map(button => {
    const icon = button.querySelector('svg')!;
    const box = button.getBoundingClientRect(); const svg = icon.getBoundingClientRect();
    return { x: Math.abs(box.x + box.width / 2 - svg.x - svg.width / 2), y: Math.abs(box.y + box.height / 2 - svg.y - svg.height / 2), width: svg.width, expected: Number(icon.getAttribute('width')) };
  }));
  expect(offsets.length).toBeGreaterThan(0);
  expect(offsets.every(offset => offset.x < 0.6 && offset.y < 0.6 && offset.width === offset.expected)).toBe(true);
});
