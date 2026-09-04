import { describe, expect, it } from 'vitest';
import { parseTelegramExport, telegramParserInternals } from './parser';

const wrap = (body: string) => `<!doctype html><html><body><div class="history">${body}</div></body></html>`;

const service = (id: string, text = '15 June 2026') =>
  `<div class="message service" id="message${id}"><div class="body details">${text}</div></div>`;

const message = ({
  id,
  author,
  joined = false,
  text,
  media = '',
}: {
  id: string;
  author?: string;
  joined?: boolean;
  text: string;
  media?: string;
}) => `
  <div class="message default clearfix${joined ? ' joined' : ''}" id="message${id}">
    <div class="body">
      <div class="pull_right date details" title="15.06.2026 10:22:43 UTC+03:00">10:22</div>
      ${author ? `<div class="from_name">${author}</div>` : ''}
      ${media}
      ${text ? `<div class="text">${text}</div>` : ''}
    </div>
  </div>`;

describe('Telegram parser', () => {
  it('ignores service messages and forward-fills author only for joined messages', () => {
    const html = wrap(
      service('-1') +
        message({
          id: '8',
          author: 'Кирилл',
          text: 'Для знакомства предлагаю каждому написать один комментарий по шаблону:<br>1. Как тебя зовут?<br>2. Из какого ты города?<br>3. Сколько тебе лет?<br>4. Чем занимаешься?<br>5. Что тяжело?<br>6. Что важно?<br>7. Результат?<br>8. Чем полезен?',
        }) +
        message({
          id: '9',
          joined: true,
          text: '#знакомство<br>1. Иван<br>2. Санкт-Петербург<br>3. 38 лет<br>4. Строительство<br>5. Долги<br>6. Семья<br>7. Закрыть долги<br>8. Стройка и недвижимость',
        }) +
        message({
          id: '10',
          text: '1. Без автора<br>2. Москва<br>3. 30<br>4. IT',
        }),
    );

    const result = parseTelegramExport(html);

    expect(result.messages).toHaveLength(3);
    expect(result.messages[1]?.authorDisplayName).toBe('Кирилл');
    expect(result.messages[2]?.authorDisplayName).toBeUndefined();
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0]?.name).toBe('Иван');
    expect(result.profiles[0]?.city).toBe('Санкт-Петербург');
    expect(result.warnings.some((warning) => warning.code === 'profile-without-author')).toBe(true);
  });

  it('maps emoji numbering and combined 6-7 without inventing absent fields', () => {
    const html = wrap(
      message({
        id: '20',
        author: 'Ilya',
        text: '1️⃣ Илья<br>2️⃣ Санкт-Петербург<br>3️⃣ 27 лет<br>4️⃣ Предприниматель<br>5️⃣ Долг<br>6-7. Стабилизировать доход и закрыть долг<br>8️⃣ Могу помочь с e-commerce',
      }),
    );

    const profile = parseTelegramExport(html).profiles[0];

    expect(profile?.name).toBe('Илья');
    expect(profile?.age).toBe(27);
    expect(profile?.currentPriority).toBe('Стабилизировать доход и закрыть долг');
    expect(profile?.goal90Days).toBe('Стабилизировать доход и закрыть долг');
    expect(profile?.telegramUsername).toBeUndefined();
    expect(profile?.domains).toEqual([]);
  });

  it('does not assign a mentioned Telegram username to the author', () => {
    const html = wrap(
      message({
        id: '30',
        author: 'Эд Раткевич',
        text: '#знакомство<br>Спасибо <a href="https://t.me/kvedrov">@kvedrov</a>, что собрал.<br>1. Эд<br>2. Санкт-Петербург<br>3. 38 лет<br>4. Тренер по голосу<br>5. Стабилизировать доход<br>6. Семья<br>7. Рост дохода<br>8. Голос и речь',
      }),
    );

    const result = parseTelegramExport(html);
    expect(result.profiles[0]?.telegramUsername).toBeUndefined();
    expect(result.messages[0]?.links[0]?.username).toBe('kvedrov');
  });

  it('assigns a Telegram username only with explicit self-contact context', () => {
    const html = wrap(
      message({
        id: '40',
        author: 'Павел',
        text: '#знакомство<br>1. Павел<br>2. Москва<br>3. 32 года<br>4. Продажи<br>5. Найти клиентов<br>6. Рост<br>7. 10 новых клиентов<br>8. Продажи<br>Мой телеграм: <a href="https://t.me/pavel_sales">@pavel_sales</a>',
      }),
    );

    const profile = parseTelegramExport(html).profiles[0];
    expect(profile?.telegramUsername).toBe('pavel_sales');
    expect(profile?.id).toBe('tg_pavel_sales');
  });

  it('extracts included and missing photo metadata', () => {
    const included = `<div class="media_wrap"><a class="photo_wrap clearfix pull_left" href="photos/photo_1.jpg"><img class="photo" src="photos/photo_1_thumb.jpg"></a></div>`;
    const missing = `<div class="media_wrap"><div class="media clearfix pull_left media_photo"><div class="title bold">Photo</div><div class="description">Not included, change data exporting settings to download.</div><div class="status details">960×1280, 83.1 KB</div></div></div>`;

    const html = wrap(
      message({
        id: '50',
        author: 'Илья',
        media: included + missing,
        text: '1. Илья<br>2. СПб<br>3. 27<br>4. IT<br>5. Рост<br>6. Семья<br>7. Запуск<br>8. IT',
      }),
    );

    const result = parseTelegramExport(html);
    expect(result.messages[0]?.attachments).toHaveLength(2);
    expect(result.messages[0]?.attachments[0]).toMatchObject({
      kind: 'photo',
      href: 'photos/photo_1.jpg',
      included: true,
    });
    expect(result.messages[0]?.attachments[1]).toMatchObject({
      kind: 'photo',
      included: false,
      status: '960×1280, 83.1 KB',
    });
    expect(result.profiles[0]?.realImageReference).toBe('photos/photo_1.jpg');
  });

  it('handles a photo-first message followed by a joined profile and age inside field 1', () => {
    const photo = `<div class="media_wrap"><a class="photo_wrap clearfix pull_left" href="photos/kirill.jpg"><img class="photo" src="photos/kirill_thumb.jpg"></a></div>`;
    const html = wrap(
      message({ id: '80', author: 'KIRILL ORLOV', media: photo, text: '' }) +
        message({
          id: '81',
          joined: true,
          text: '1. Кирилл Орлов, 32 года<br>2. Санкт-Петербург<br>4. Предприниматель<br>5. Масштабирование<br>6. Семья<br>7. Запуск продукта<br>8. Продажи',
        }),
    );

    const result = parseTelegramExport(html);
    const profile = result.profiles[0];

    expect(profile?.name).toBe('Кирилл Орлов');
    expect(profile?.age).toBe(32);
    expect(profile?.realImageReference).toBe('photos/kirill.jpg');
    expect(profile?.sourceMessageId).toBe('80');
  });

  it('deduplicates repeated profiles by participant identity and keeps IDs stable', () => {
    const html = wrap(
      message({
        id: '60',
        author: 'Денис',
        text: '1. Денис<br>2. СПб<br>3. 33<br>4. Продажи<br>5. Клиенты<br>6. Рост<br>7. План<br>8. Продажи',
      }) +
        message({
          id: '61',
          author: 'Другой',
          text: 'Обычное сообщение',
        }) +
        message({
          id: '70',
          author: 'Денис',
          text: '1. Денис<br>2. Санкт-Петербург<br>3. 33 года<br>4. Продажи и управление<br>5. Найти клиентов<br>6. Семья и рост<br>7. Увеличить выручку<br>8. Помогаю с продажами и наймом',
        }),
    );

    const first = parseTelegramExport(html);
    const second = parseTelegramExport(html);

    expect(first.profiles).toHaveLength(1);
    expect(first.profiles[0]?.occupation).toContain('Продажи');
    expect(first.profiles[0]?.id).toBe(second.profiles[0]?.id);
  });

  it('stable ID helper is deterministic', () => {
    const params = {
      displayName: 'Тестовый участник',
      firstMessageId: '123',
      rawProfileText: '1. Тест',
    };

    expect(telegramParserInternals.createStableProfileId(params)).toBe(
      telegramParserInternals.createStableProfileId(params),
    );
  });
});
