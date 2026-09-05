import { describe, expect, it } from 'vitest';
import type { Profile } from '../types/profile';
import { cleanProfileName, extractFreeFormProfileFields, extractProfileName, getProfileDisplayName, normalizeProfile } from './profile-normalization';

describe('profile name normalization', () => {
  it.each([
    ['Как тебя зовут? - Александр', 'Александр'],
    ['1. Как тебя зовут? Александр', 'Александр'],
    ['Имя: Кирилл Орлов', 'Кирилл Орлов'],
    ['Меня зовут Степан', 'Степан'],
    ['ФИО — Дмитрий Соколов', 'Дмитрий Соколов'],
    ['Даниил, 32 года', 'Даниил'],
  ])('cleans %s', (input, expected) => {
    expect(cleanProfileName(input)).toBe(expected);
  });

  it('does not damage a normal full name', () => {
    expect(cleanProfileName('Леонид Цветков')).toBe('Леонид Цветков');
  });
  it('recovers the actual name from an existing corrupted import', () => {
    expect(getProfileDisplayName({ name: 'розница Пошив производство', telegramDisplayName: 'Артём', rawProfileText: '1. Артем 29\n2 направления\n1 розница Пошив производство одежды' } as Parameters<typeof getProfileDisplayName>[0])).toBe('Артем');
  });
  it.each([
    ['#знакомство 1. Владимир 2. Санкт-Петербург 3. 34 года', 'Владимир'],
    ['1️⃣ Сергей Волков\n2️⃣ Москва', 'Сергей Волков'],
    ['Всем привет! Меня зовут Влад (но все называют Флоки)\n2. Санкт-Петербург', 'Влад'],
  ])('extracts a bounded identity from %s', (raw, name) => {
    expect(extractProfileName(raw)).toBe(name);
  });

  it('repairs an already imported free-form profile from its full text', () => {
    const raw = `#знакомство

Мужчины, привет каждому

Зовут Сергей, из Москвы, 43 года.
Последние восемь лет работаю на себя, ИП, продюсер рекламного и медиа контента.

Самое тяжелое сейчас в жизни это кеш, сфера деградировала.

Самое важное - обеспечить базу семье, раздать долги.

Результат через 90 дней - отдать часть острых долгов, наладить базу финансов.

Могу быть полезен: стратегия и маркетинг, упаковка продукта.`;
    expect(extractFreeFormProfileFields(raw)).toMatchObject({
      name: 'Сергей',
      city: 'Москва',
      age: 43,
      occupation: 'ИП, продюсер рекламного и медиа контента',
      currentChallenge: 'в жизни это кеш, сфера деградировала',
      currentPriority: 'обеспечить базу семье, раздать долги',
      goal90Days: 'отдать часть острых долгов, наладить базу финансов',
      canHelpWith: 'стратегия и маркетинг, упаковка продукта',
    });

    const repaired = normalizeProfile({ name: 'млн', telegramDisplayName: 'Сергей Fox', rawProfileText: raw } as Profile);
    expect(repaired.name).toBe('Сергей');
    expect(repaired.occupation).toBe('ИП, продюсер рекламного и медиа контента');
    expect(repaired.canHelpWith).toContain('стратегия и маркетинг');
  });
});
