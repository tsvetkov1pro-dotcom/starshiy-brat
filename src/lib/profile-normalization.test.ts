import { describe, expect, it } from 'vitest';
import { cleanProfileName, extractProfileName, getProfileDisplayName } from './profile-normalization';

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
});
