import { describe, expect, it } from 'vitest';
import { cleanProfileName } from './profile-normalization';

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
});
