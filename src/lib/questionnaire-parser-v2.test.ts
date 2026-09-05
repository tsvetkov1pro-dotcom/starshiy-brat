import { parseQuestionnaireV2, reparseProfileV2, PROFILE_PARSER_VERSION } from './questionnaire-parser-v2';
import type { Profile } from '../types/profile';

describe('questionnaire parser v2', () => {
  it('maps the canonical 1-8 questionnaire to stable semantic fields', () => {
    const parsed = parseQuestionnaireV2(`
1. Константин Петров
2. Москва
3. 35 лет
4. Руководитель строительной компании, занимаюсь коммерческими объектами.
5. Самое тяжелое — выйти из операционки.
6. Сейчас самое важное — команда и семья.
7. Через 90 дней буду гордиться запуском второго направления.
8. Могу помочь с управлением стройкой, наймом и подрядчиками.
`);

    expect(parsed.layout).toBe('canonical-8');
    expect(parsed.name).toBe('Константин Петров');
    expect(parsed.city).toBe('Москва');
    expect(parsed.age).toBe(35);
    expect(parsed.occupation).toContain('строительной компании');
    expect(parsed.currentChallenge).toContain('операционки');
    expect(parsed.currentPriority).toContain('команда и семья');
    expect(parsed.goal90Days).toContain('90 дней');
    expect(parsed.canHelpWith).toContain('Могу помочь');
  });

  it('corrects the historical shifted layout and extracts free-form help bullets', () => {
    const raw = `Всем привет!
1. Цветков Леонид. 33 года.
2. Санкт-Петербург, Приморский район.
3. Предприниматель. Основное направление — текстильное ателье: оформление квартир, домов и коммерческих объектов под ключ. Второе направление — грузоперевозки.
4. Самое тяжёлое сейчас — не утонуть в количестве задач. Одновременно развиваю несколько направлений, поэтому постоянно приходится балансировать между развитием бизнеса и операционкой.
5. Самое важное — масштабирование текстильного ателье.
6. Через 90 дней буду гордиться, если запущу новый канал привлечения клиентов.
+ Помогу сильно сэкономить на текстильном оформлении квартиры, дома или бизнеса без потери качества.
+ Грузоперевозки со скидкой для участников чата.
+ Могу быстро найти подрядчика практически под любую задачу.
• Есть опыт капитального ремонта своего цеха 300 м².
• Есть проверенные юристы. Могу помочь контактом по юридическим вопросам.
Для себя ищу сильное окружение, партнёров по швейному направлению.
Помогают окружение и новые связи.`;

    const parsed = parseQuestionnaireV2(raw);

    expect(parsed.layout).toBe('legacy-shifted');
    expect(parsed.name).toBe('Цветков Леонид');
    expect(parsed.city).toBe('Санкт-Петербург, Приморский район');
    expect(parsed.age).toBe(33);
    expect(parsed.occupation).toContain('текстильное ателье');
    expect(parsed.occupation).toContain('грузоперевозки');
    expect(parsed.occupation).not.toContain('не утонуть в количестве задач');
    expect(parsed.currentChallenge).toContain('не утонуть в количестве задач');
    expect(parsed.currentPriority).toContain('масштабирование текстильного ателье');
    expect(parsed.goal90Days).toContain('Через 90 дней');
    expect(parsed.goal90Days).not.toContain('Для себя ищу');
    expect(parsed.goal90Days).not.toContain('Помогают окружение');
    expect(parsed.canHelpWith).toContain('текстильном оформлении');
    expect(parsed.canHelpWith).toContain('Грузоперевозки');
    expect(parsed.canHelpWith).toContain('подрядчика');
    expect(parsed.canHelpWith).toContain('юристы');
    expect(parsed.canHelpWith).not.toContain('Для себя ищу');
  });

  it('keeps identity and user-facing state while reparsing semantic fields', () => {
    const profile: Profile = {
      id: 'stable-id',
      telegramDisplayName: 'Леонид',
      telegramUsername: 'stable_user',
      name: 'Леонид',
      city: 'Санкт-Петербург',
      age: 33,
      occupation: 'Самое тяжёлое сейчас — не утонуть в количестве задач',
      canHelpWith: undefined,
      domains: ['Предпринимательство'],
      challenges: ['Масштабирование'],
      searchKeywords: ['текстиль'],
      rawProfileText: `1. Цветков Леонид. 33 года.\n2. Санкт-Петербург.\n3. Предприниматель. Основное направление — текстильное ателье.\n4. Самое тяжёлое сейчас — не утонуть в количестве задач.\n5. Самое важное — рост бизнеса.\n6. Через 90 дней запущу новый канал.\n+ Могу помочь с текстильным оформлением.`,
      sourceMessageId: '123',
      avatarSeed: 'stable-avatar',
    };

    const next = reparseProfileV2(profile);
    expect(next.id).toBe('stable-id');
    expect(next.telegramUsername).toBe('stable_user');
    expect(next.avatarSeed).toBe('stable-avatar');
    expect(next.domains).toEqual(['Предпринимательство']);
    expect(next.occupation).toContain('текстильное ателье');
    expect(next.canHelpWith).toContain('текстильным оформлением');
    expect(next.parserVersion).toBe(PROFILE_PARSER_VERSION);
  });
});
