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

test('golden master home geometry stays dense and proportional', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.brand-wordmark')).toBeVisible({ visible: testInfo.project.name !== 'mobile-chromium' });
  await expect(page.locator('.hero--approved')).toBeVisible();
  await expect(page.getByText('Сферы сообщества')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Поиск' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const hero = await page.locator('.hero--approved').boundingBox();
  const search = await page.locator('.search-bridge').boundingBox();
  const dashboard = await page.locator('.dashboard-grid').boundingBox();
  const favorites = await page.locator('.favorites-strip').boundingBox();
  const domains = await page.locator('.domains-panel').boundingBox();
  const challenges = await page.locator('.challenges-panel').boundingBox();

  expect(hero).not.toBeNull(); expect(search).not.toBeNull(); expect(dashboard).not.toBeNull(); expect(favorites).not.toBeNull(); expect(domains).not.toBeNull(); expect(challenges).not.toBeNull();
  if (hero && search && dashboard && favorites && domains && challenges) {
    if (testInfo.project.name !== 'mobile-chromium') {
      expect(hero.height).toBeGreaterThanOrEqual(220);
      expect(hero.height).toBeLessThanOrEqual(270);
      expect(search.width).toBeGreaterThanOrEqual(hero.width * 0.64);
      expect(search.y).toBeLessThan(hero.y + hero.height);
      expect(search.y + search.height).toBeGreaterThan(hero.y + hero.height);
      expect(dashboard.height).toBeLessThanOrEqual(210);
      expect(favorites.height).toBeLessThanOrEqual(125);
      const insightRatio = domains.width / challenges.width;
      expect(insightRatio).toBeGreaterThanOrEqual(0.95);
      expect(insightRatio).toBeLessThanOrEqual(1.15);
      const sphere = await page.locator('.domain-tile-v1').first().boundingBox();
      expect(sphere).not.toBeNull();
      if (sphere) expect(sphere.height).toBeGreaterThanOrEqual(118);
    } else {
      expect(hero.height).toBeLessThanOrEqual(210);
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

test('find page uses the same SmartSearch and focuses on first click', async ({ page }) => {
  await importFixture(page);
  await page.goto('/find');
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.click();
  await expect(search).toBeFocused();
  await search.type('груз');
  await expect(page.getByRole('listbox', { name: 'Подсказки поиска' })).toBeVisible();
  await expect(page.getByRole('option').filter({ hasText: 'Грузоперевозки и логистика' })).toBeVisible();
});

test('power search suggests related concepts, finds raw text and keeps clean names', async ({ page }, testInfo) => {
  await importFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('груз');
  await expect(page.getByRole('listbox', { name: 'Подсказки поиска' })).toBeVisible();
  await expect(page.getByRole('option').filter({ hasText: 'Грузоперевозки и логистика' })).toBeVisible();
  await page.getByRole('option').filter({ hasText: 'Грузоперевозки и логистика' }).click();

  await expect(page).toHaveURL(/\/find\?q=/);
  const cleanName = page.locator('.profile-card__title').filter({ hasText: /^Александр$/ }).first();
  await expect(cleanName).toBeVisible();
  await expect(page.locator('.profile-card__title').filter({ hasText: /Как тебя зовут\?/ })).toHaveCount(0);
  await expect(page.locator('.search-highlight').first()).toBeVisible();

  const alex = page.locator('.profile-card--result').filter({ hasText: 'Александр' }).first();
  await expect(alex).toContainText(/логист|достав|перевоз|груз/i);
  await page.screenshot({ path: `test-results/search-${testInfo.project.name}.png`, fullPage: true });

  await alex.locator('.profile-card__open').click();
  await expect(page.getByRole('heading', { name: 'Александр' })).toBeVisible();
  await expect(page.getByText('Чем занимается')).toBeVisible();
  await expect(page.getByText('Чем может быть полезен')).toBeVisible();
  await page.screenshot({ path: `test-results/profile-${testInfo.project.name}.png`, fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Александр' })).toHaveCount(0);
});

test('recommendation refresh changes four compact cards without overflow', async ({ page }, testInfo) => {
  await importFixture(page);
  const select = page.locator('.self-select select');
  const selfOption = select.locator('option').filter({ hasText: 'Леонид Цветков' }).first();
  const selfValue = await selfOption.getAttribute('value');
  expect(selfValue).not.toBeNull();
  await select.selectOption(selfValue!);
  const cards = page.locator('.recommendation-grid .profile-card');
  const titles = page.locator('.recommendation-grid .profile-card__title');
  await expect(cards).toHaveCount(4);
  const before = await titles.allTextContents();
  await page.getByRole('button', { name: 'Обновить подборку' }).click();
  await expect.poll(async () => titles.allTextContents()).not.toEqual(before);

  const sizes = await cards.evaluateAll((elements) => elements.map((element) => ({ height: element.getBoundingClientRect().height, leaking: element.scrollWidth > element.clientWidth + 1 })));
  expect(sizes.every(({ height, leaking }) => height <= 120 && !leaking)).toBe(true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/recommendations-${testInfo.project.name}.png`, fullPage: true });
});

test('directory cards stay dense instead of giant empty containers', async ({ page }) => {
  await importFixture(page);
  await page.goto('/domains?domain=Продажи');
  const firstCard = page.locator('.profile-card--result').first();
  await expect(firstCard).toBeVisible();
  const box = await firstCard.boundingBox();
  expect(box).not.toBeNull();
  if (box) expect(box.height).toBeLessThanOrEqual(230);
  const leak = await page.locator('.profile-card--result').evaluateAll((elements) => elements.some((element) => element.scrollWidth > element.clientWidth + 1));
  expect(leak).toBe(false);
});