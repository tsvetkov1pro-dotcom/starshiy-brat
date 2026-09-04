import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types/profile';
import { searchProfiles } from './search';

const makeProfile = (id: string, overrides: Partial<Profile> = {}): Profile => ({
  id,
  telegramDisplayName: `Участник ${id}`,
  name: `Участник ${id}`,
  domains: [],
  challenges: [],
  searchKeywords: [],
  rawProfileText: '',
  avatarSeed: id,
  ...overrides,
});

describe('local search', () => {
  it('always ranks an exact name match first', () => {
    const exact = makeProfile('exact', {
      name: 'Леонид Цветков',
      telegramDisplayName: 'Цветков Леонид',
      occupation: 'Текстильное ателье',
    });
    const noisy = makeProfile('noisy', {
      name: 'Другой человек',
      canHelpWith: 'Могу познакомить с Леонидом Цветковым и помочь по продажам',
      rawProfileText: 'Леонид Цветков упоминается несколько раз',
    });

    const results = searchProfiles([noisy, exact], 'Леонид Цветков');
    expect(results[0]?.profile.id).toBe('exact');
    expect(results[0]?.reasons[0]?.field).toBe('exact');
  });

  it('prioritizes canHelpWith and occupation for a natural-language usefulness query', () => {
    const seller = makeProfile('seller', {
      occupation: 'Коммерческий директор B2B',
      canHelpWith: 'Помогу построить отдел продаж и увеличить конверсию',
      domains: ['Продажи'],
    });
    const mention = makeProfile('mention', {
      rawProfileText: 'Иногда обсуждаю продажи, но это не моя специализация',
    });

    const results = searchProfiles([mention, seller], 'кто может помочь с продажами B2B');
    expect(results[0]?.profile.id).toBe('seller');
    expect(results[0]?.reasons.some((reason) => reason.field === 'canHelpWith')).toBe(true);
  });

  it('understands common city and AI aliases without a server', () => {
    const profile = makeProfile('ai-spb', {
      city: 'Санкт-Петербург',
      occupation: 'AI разработка и нейросети',
      domains: ['IT / AI'],
    });

    const results = searchProfiles([profile], 'кто из Питера работает с ИИ');
    expect(results[0]?.profile.id).toBe('ai-spb');
    expect(results[0]?.reasons.some((reason) => reason.field === 'city')).toBe(true);
  });

  it('searches at least 500 profiles quickly and deterministically', () => {
    const profiles = Array.from({ length: 500 }, (_, index) =>
      makeProfile(String(index), {
        name: `Участник ${index}`,
        city: index % 2 === 0 ? 'Санкт-Петербург' : 'Москва',
        occupation: index === 347 ? 'B2B продажи и CRM автоматизация' : 'Предприниматель',
        canHelpWith: index === 347 ? 'Помогу построить отдел продаж' : 'Обмен опытом',
        domains: index === 347 ? ['Продажи', 'IT / AI'] : ['Другое'],
      }),
    );

    const startedAt = performance.now();
    const results = searchProfiles(profiles, 'B2B продажи CRM');
    const duration = performance.now() - startedAt;

    expect(results[0]?.profile.id).toBe('347');
    expect(duration).toBeLessThan(500);
  });
});
