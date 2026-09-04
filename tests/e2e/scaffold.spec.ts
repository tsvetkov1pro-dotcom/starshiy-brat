import { expect, test, type Page } from '@playwright/test';

const telegramHtml = `<!doctype html><html><body>
<div class="message default clearfix" id="message1"><div class="body"><div class="from_name">Леонид Цветков</div><div class="text">1. Леонид Цветков<br>2. Санкт-Петербург<br>3. 33 года<br>4. Предприниматель, текстильное производство и продажи<br>5. Масштабирование бизнеса<br>6. Системный рост<br>7. Увеличить продажи<br>8. Могу помочь с Авито, CRM и управлением</div></div></div>
<div class="message default clearfix" id="message2"><div class="body"><div class="from_name">Александр</div><div class="text">1. Как тебя зовут? - Александр<br>2. Санкт-Петербург<br>3. 35 лет<br>4. Руководитель транспортной компании<br>5. Масштабирование<br>6. Рост команды<br>7. Расширить географию<br>8. Помогу с логистикой, доставкой грузов и перевозками по России</div></div></div>
<div class="message default clearfix" id="message3"><div class="body"><div class="from_name">Даниил Петров</div><div class="text">1. Даниил Петров<br>2. Санкт-Петербург<br>3. 32 года<br>4. Международная логистика и экспедирование<br>5. Поиск клиентов<br>6. Партнерства<br>7. Запустить новый маршрут<br>8. Перевозка морских грузов, таможня, доставка</div></div></div>
<div class="message default clearfix" id="message4"><div class="body"><div class="from_name">Игорь К.</div><div class="text">1. Игорь К.<br>2. Санкт-Петербург<br>3. 37 лет<br>4. Строительство и ремонт<br>5. Масштабирование<br>6. Сильная команда<br>7. Открыть второй филиал<br>8. Могу помочь с подрядчиками и стройкой</div></div></div>
<div class="message default clearfix" id="message5"><div class="body"><div class="from_name">Рустэм М.</div><div class="text">1. Рустэм М.<br>2. Санкт-Петербург<br>3. 38 лет<br>4. B2B продажи<br>5. Рост продаж<br>6. Отдел продаж<br>7. Увеличить конверсию<br>8. Помогу построить B2B продажи и переговоры</div></div></div>
<div class="message default clearfix" id="message6"><div class="body"><div class="from_name">Антон М.</div><div class="text">1. Антон М.<br>2. Санкт-Петербург<br>3. 40 лет<br>4. Финансы и инвестиции<br>5. Масштабирование<br>6. Управление деньгами<br>7. Инвестиционный проект<br>8. Финансовое планирование и инвестиции</div></div></div>
<div class="message default clearfix" id="message7"><div class="body"><div class="from_name">Павел Л.</div><div class="text">1. Павел Л.<br>2. Санкт-Петербург<br>3. 34 года<br>4. Производство мебели<br>5. Масштабирование<br>6. Эффективность<br>7. Новый цех<br>8. Производство, процессы и управление командой</div></div></div>
</body></html>`;

async function importFixture(page: Page) {
  await page.goto('/import');
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: 'messages.html', mimeType: 'text/html', buffer: Buffer.from(telegramHtml) });
  await expect(page.getByText(/Импортировано 7 визиток/i)).toBeVisible();
  await page.getByRole('button', { name: 'Перейти на главную' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('canonical home renders without overflow and keeps approved proportions', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.hero--approved')).toBeVisible();
  await expect(page.getByText('Сферы сообщества')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Поиск' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const hero = await page.locator('.hero--approved').boundingBox();
  const search = await page.locator('.search-bridge').boundingBox();
  const dashboard = await page.locator('.dashboard-grid').boundingBox();
  const favorites = await page.locator('.favorites-strip').boundingBox();
  const insights = await page.locator('.insight-grid').boundingBox();

  expect(hero).not.toBeNull(); expect(search).not.toBeNull(); expect(dashboard).not.toBeNull(); expect(favorites).not.toBeNull(); expect(insights).not.toBeNull();
  if (hero && search && dashboard && favorites && insights) {
    if (testInfo.project.name !== 'mobile-chromium') {
      expect(hero.height).toBeGreaterThanOrEqual(190);
      expect(hero.height).toBeLessThanOrEqual(300);
      expect(search.width).toBeGreaterThanOrEqual(hero.width * 0.62);
      expect(dashboard.y - (search.y + search.height)).toBeGreaterThanOrEqual(8);
      expect(favorites.y - (dashboard.y + dashboard.height)).toBeGreaterThanOrEqual(12);
      expect(insights.y - (favorites.y + favorites.height)).toBeGreaterThanOrEqual(12);
    } else {
      expect(hero.height).toBeLessThanOrEqual(220);
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

test('power search suggests related concepts, finds raw text and keeps clean names', async ({ page }) => {
  await importFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('груз');
  await expect(page.getByRole('listbox', { name: 'Подсказки поиска' })).toBeVisible();
  await expect(page.getByRole('option').filter({ hasText: 'Грузоперевозки и логистика' })).toBeVisible();
  await page.getByRole('option').filter({ hasText: 'Грузоперевозки и логистика' }).click();

  await expect(page).toHaveURL(/\/find\?q=/);
  await expect(page.getByText('Александр', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Как тебя зовут\?/)).toHaveCount(0);
  await expect(page.locator('.search-highlight').first()).toBeVisible();

  const alex = page.locator('.profile-card--result').filter({ hasText: 'Александр' }).first();
  await expect(alex).toContainText(/логист|достав|перевоз|груз/i);
  await alex.locator('.profile-card__open').click();
  await expect(page.getByRole('heading', { name: 'Александр' })).toBeVisible();
  await expect(page.getByText('Чем занимается')).toBeVisible();
  await expect(page.getByText('Чем может быть полезен')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Александр' })).toHaveCount(0);
});

test('recommendation refresh changes the visible recommendation order and cards never overflow', async ({ page }) => {
  await importFixture(page);
  const select = page.locator('.self-select select');
  await select.selectOption({ label: /Леонид Цветков/ });
  const cards = page.locator('.recommendation-grid .profile-card__title');
  await expect(cards).toHaveCount(4);
  const before = await cards.allTextContents();
  await page.getByRole('button', { name: 'Обновить подборку' }).click();
  const after = await cards.allTextContents();
  expect(after).not.toEqual(before);

  const leaking = await page.locator('.profile-card').evaluateAll((elements) => elements.some((element) => element.scrollWidth > element.clientWidth + 1));
  expect(leaking).toBe(false);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
