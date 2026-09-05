import { expect, test, type Page } from '@playwright/test';

const identityHtml = `<!doctype html><html><body>
<div class="message default clearfix" id="message1"><div class="body"><div class="from_name">Леонид Цветков</div><div class="text">1. Леонид Цветков<br>2. Санкт-Петербург<br>3. 33 года<br>4. Предприниматель, текстильное производство<br>5. Масштабирование бизнеса<br>6. Системный рост<br>7. Увеличить продажи<br>8. Могу помочь с Авито, CRM и управлением</div></div></div>
<div class="message default clearfix" id="message2"><div class="body"><div class="from_name">Константин Иванов</div><div class="text">1. Константин Иванов<br>2. Санкт-Петербург<br>3. 35 лет<br>4. Строительство<br>5. Рост команды<br>6. Продажи<br>7. Открыть филиал<br>8. Могу помочь со стройкой и подрядчиками</div></div></div>
<div class="message default clearfix" id="message3"><div class="body"><div class="from_name">Константин Петров</div><div class="text">1. Константин Петров<br>2. Москва<br>3. 34 года<br>4. IT / AI<br>5. Запуск продукта<br>6. Автоматизация<br>7. Запустить новый сервис<br>8. Могу помочь с разработкой и AI</div></div></div>
<div class="message default clearfix" id="message4"><div class="body"><div class="from_name">Костя Лебедев</div><div class="text">1. Костя Лебедев<br>2. Санкт-Петербург<br>3. 31 год<br>4. Продажи<br>5. Рост выручки<br>6. Переговоры<br>7. Усилить отдел продаж<br>8. Помогу с B2B продажами</div></div></div>
<div class="message default clearfix" id="message5"><div class="body"><div class="from_name">Максим Орлов</div><div class="text">1. Максим Орлов<br>2. Санкт-Петербург<br>3. 36 лет<br>4. Финансы<br>5. Инвестиции<br>6. Планирование<br>7. Найти партнёров<br>8. Работаю с Константином и могу познакомить</div></div></div>
<div class="message default clearfix" id="message6"><div class="body"><div class="from_name">Дмитрий Соколов</div><div class="text">1. Дмитрий Соколов<br>2. Санкт-Петербург<br>3. 38 лет<br>4. Логистика и грузовой транспорт<br>5. Масштабирование перевозок<br>6. Операционное управление<br>7. Расширить автопарк<br>8. Могу помочь с грузоперевозками, логистикой и транспортом</div></div></div>
</body></html>`;

async function importIdentityFixture(page: Page) {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'identity.html',
    mimeType: 'text/html',
    buffer: Buffer.from(identityHtml),
  });
  await expect(page.getByText(/Импортировано 6 визиток/i)).toBeVisible();
  await page.getByRole('button', { name: 'Перейти на главную' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('Find page starts with the complete imported directory', async ({ page }) => {
  await importIdentityFixture(page);
  await page.goto('/find');
  await expect(page.getByText('Все участники: 6')).toBeVisible();
  await expect(page.locator('.directory-grid .profile-card--result')).toHaveCount(6);
});

test('Konstantin autocomplete and Enter use the same identities and exclude raw-text mentions', async ({ page }) => {
  await importIdentityFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('Константин');
  const listbox = page.getByRole('listbox', { name: 'Подсказки поиска' });
  await expect(listbox).toBeVisible();

  const quickNames = await listbox.locator('.search-suggestion__content strong').allTextContents();
  expect(quickNames).toContain('Константин Иванов');
  expect(quickNames).toContain('Константин Петров');
  expect(quickNames).not.toContain('Максим Орлов');

  await search.press('Enter');
  await expect(page).toHaveURL(/\/find\?q=/);
  await expect(page.locator('.profile-card__title')).toHaveCount(quickNames.length);
  const resultNames = await page.locator('.profile-card__title').allTextContents();
  expect(resultNames).toEqual(quickNames);
});

test('Kostya query keeps literal Kostya first and includes Konstantins without unrelated people', async ({ page }) => {
  await importIdentityFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('Костя');
  const listbox = page.getByRole('listbox', { name: 'Подсказки поиска' });
  await expect(listbox).toBeVisible();

  const quickNames = await listbox.locator('.search-suggestion__content strong').allTextContents();
  expect(quickNames[0]).toBe('Костя Лебедев');
  expect(quickNames).toContain('Константин Иванов');
  expect(quickNames).toContain('Константин Петров');
  expect(quickNames).not.toContain('Максим Орлов');

  await search.press('Enter');
  await expect(page).toHaveURL(/\/find\?q=/);
  await expect(page.locator('.profile-card__title')).toHaveCount(quickNames.length);
  const resultNames = await page.locator('.profile-card__title').allTextContents();
  expect(resultNames).toEqual(quickNames);
});

test('desktop person suggestion opens exactly that profile and keeps the source query', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium');
  await importIdentityFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('Кон');
  const target = page.getByRole('option').filter({ hasText: 'Константин Петров' });
  await expect(target).toBeVisible();
  await target.click();

  await expect(page.locator('.profile-sheet__identity h2')).toHaveText('Константин Петров');
  await expect(search).toHaveValue('Кон');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.profile-context')).toContainText('Кон');
});

test('desktop semantic person suggestion opens the relevant person instead of searching their first name', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium');
  await importIdentityFixture(page);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('грузо');
  const target = page.getByRole('option').filter({ hasText: 'Дмитрий Соколов' });
  await expect(target).toBeVisible();
  await target.click();

  await expect(page.locator('.profile-sheet__identity h2')).toHaveText('Дмитрий Соколов');
  await expect(search).toHaveValue('грузо');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.profile-context')).toContainText('грузо');
});

test('desktop result cards have one standardized help block and centered copy icon', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium');
  await importIdentityFixture(page);
  await page.goto('/find');

  const card = page.locator('.profile-card--result').filter({ hasText: 'Константин Иванов' });
  await expect(card).toBeVisible();
  await expect(card.locator('.profile-card__excerpt > span')).toHaveText('ЧЕМ МОЖЕТ ПОМОЧЬ');
  await expect(card.locator('.profile-card__excerpt > span')).toHaveCount(1);
  await expect(card.locator('.profile-card__excerpt')).toContainText('Могу помочь со стройкой и подрядчиками');
  await expect(card.locator('.profile-card__reason')).toHaveCount(0);

  const copy = card.getByRole('button', { name: /Скопировать имя/ });
  const svg = copy.locator('svg');
  const copyBox = await copy.boundingBox();
  const svgBox = await svg.boundingBox();
  expect(copyBox).not.toBeNull();
  expect(svgBox).not.toBeNull();
  if (copyBox && svgBox) {
    const buttonCenterX = copyBox.x + copyBox.width / 2;
    const buttonCenterY = copyBox.y + copyBox.height / 2;
    const iconCenterX = svgBox.x + svgBox.width / 2;
    const iconCenterY = svgBox.y + svgBox.height / 2;
    expect(Math.abs(buttonCenterX - iconCenterX)).toBeLessThanOrEqual(1);
    expect(Math.abs(buttonCenterY - iconCenterY)).toBeLessThanOrEqual(1);
  }
});

test('desktop home search uses the approved width and vertically centered input line', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium');
  await page.goto('/');
  const searchBridge = page.locator('.search-bridge');
  const home = page.locator('.home-page');
  const input = page.getByRole('textbox', { name: 'Поиск' });

  expect(await searchBridge.evaluate((element) => (element as HTMLElement).style.width)).toBe('');
  const bridgeBox = await searchBridge.boundingBox();
  const homeBox = await home.boundingBox();
  expect(bridgeBox).not.toBeNull();
  expect(homeBox).not.toBeNull();
  if (bridgeBox && homeBox) {
    const ratio = bridgeBox.width / homeBox.width;
    expect(ratio).toBeGreaterThan(0.72);
    expect(ratio).toBeLessThan(0.78);
  }
  expect(await input.evaluate((element) => getComputedStyle(element).lineHeight)).toBe('42px');
});

test('mobile viewport keeps search at non-zooming size, empty recommendations aligned and nav flush to bottom', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');

  const search = page.getByRole('textbox', { name: 'Поиск' });
  const searchFontSize = await search.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(searchFontSize).toBeGreaterThanOrEqual(16);

  const emptyCards = page.locator('.recommendation-empty');
  await expect(emptyCards).toHaveCount(4);
  await expect(page.locator('.recommendation-empty__avatar')).toHaveCount(4);
  const alignments = await emptyCards.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).textAlign));
  expect(alignments.every((alignment) => alignment === 'center')).toBe(true);

  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  const navBox = await nav.boundingBox();
  const viewport = page.viewportSize();
  expect(navBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (navBox && viewport) {
    expect(Math.abs(navBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(navBox.width - viewport.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(navBox.y + navBox.height - viewport.height)).toBeLessThanOrEqual(1);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobile self picker selects the imported identity with one tap', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await importIdentityFixture(page);
  const selfInput = page.getByRole('combobox', { name: 'Введите своё имя' });
  const fontSize = await selfInput.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);

  await selfInput.fill('Леонид');
  await page.getByRole('option').filter({ hasText: 'Леонид Цветков' }).click();
  await expect(page.getByRole('heading', { name: 'Это Вы', exact: true })).toBeVisible();
  await expect(page.locator('.self-selected')).toContainText('Леонид Цветков');
});
