import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types/profile';
import { getRelatedSearchTerms, getSearchSuggestions, searchProfiles, shouldHighlightToken } from './search';

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
  it('does not confuse Vladimir with Vlad, aliases or mentions in occupations', () => {
    const profiles = [
      makeProfile('vladimir', { name:'Владимир Иванов' }),
      makeProfile('vlad', { name:'Влад' }),
      makeProfile('vladislav', { name:'Владислав' }),
      makeProfile('roman', { name:'Роман', telegramDisplayName:'Владимир', rawProfileText:'Работаю с Владимиром' }),
      makeProfile('svyat', { name:'Святослав', canHelpWith:'Владею бизнесом' }),
    ];
    expect(searchProfiles(profiles, 'Владимир').map(r=>r.profile.id)).toEqual(['vladimir']);
    expect(searchProfiles(profiles, 'Владимир Петров')).toEqual([]);
    expect(getSearchSuggestions(profiles, 'Владимир').filter(s=>s.type==='person').map(s=>s.profileId)).toEqual(['vladimir']);
  });
  it('always ranks an exact name match first', () => {
    const exact = makeProfile('exact', { name: 'Леонид Цветков', telegramDisplayName: 'Цветков Леонид', occupation: 'Текстильное ателье' });
    const noisy = makeProfile('noisy', { name: 'Другой человек', canHelpWith: 'Могу познакомить с Леонидом Цветковым и помочь по продажам', rawProfileText: 'Леонид Цветков упоминается несколько раз' });
    const results = searchProfiles([noisy, exact], 'Леонид Цветков');
    expect(results[0]?.profile.id).toBe('exact');
    expect(results[0]?.reasons[0]?.field).toBe('exact');
  });

  it('prioritizes canHelpWith and occupation for a usefulness query', () => {
    const seller = makeProfile('seller', { occupation: 'Коммерческий директор B2B', canHelpWith: 'Помогу построить отдел продаж и увеличить конверсию', domains: ['Продажи'] });
    const mention = makeProfile('mention', { rawProfileText: 'Иногда обсуждаю продажи, но это не моя специализация' });
    const results = searchProfiles([mention, seller], 'кто может помочь с продажами B2B');
    expect(results[0]?.profile.id).toBe('seller');
    expect(results[0]?.reasons.some((reason) => reason.field === 'canHelpWith')).toBe(true);
  });

  it('understands common city and AI aliases without a server', () => {
    const profile = makeProfile('ai-spb', { city: 'Санкт-Петербург', occupation: 'AI разработка и нейросети', domains: ['IT / AI'] });
    const results = searchProfiles([profile], 'кто из Питера работает с ИИ');
    expect(results[0]?.profile.id).toBe('ai-spb');
    expect(results[0]?.reasons.some((reason) => reason.field === 'city')).toBe(true);
  });

  it('finds logistics profiles through semantic expansion and Russian word forms', () => {
    const logistics = makeProfile('logistics', {
      occupation: 'Руководитель транспортной компании',
      canHelpWith: 'Помогу с логистикой и доставкой грузов по России',
      rawProfileText: 'Организуем перевозки между регионами и экспедирование.',
      domains: ['Логистика'],
    });
    const unrelated = makeProfile('unrelated', { occupation: 'Дизайнер интерьеров', rawProfileText: 'Работаю с частными домами.' });

    const results = searchProfiles([unrelated, logistics], 'занимаюсь грузоперевозками');
    expect(results[0]?.profile.id).toBe('logistics');
    expect(results[0]?.highlightTerms.some((term) => /логист|достав|груз|перевоз/i.test(term))).toBe(true);
    expect(results[0]?.excerpt?.text).toMatch(/логист|достав|груз|перевоз/i);
  });

  it('searches any word in rawProfileText', () => {
    const profile = makeProfile('raw', { rawProfileText: 'Последние пять лет развиваю международное экспедирование морских грузов.' });
    const results = searchProfiles([profile], 'морских грузов');
    expect(results[0]?.profile.id).toBe('raw');
    expect(results[0]?.reasons.some((reason) => reason.field === 'rawProfileText')).toBe(true);
  });

  it('provides local autocomplete suggestions and related concepts', () => {
    const profile = makeProfile('logistics', { name: 'Даниил Петров', occupation: 'Логистика', domains: ['Логистика'] });
    const suggestions = getSearchSuggestions([profile], 'груз');
    expect(suggestions.some((item) => item.type === 'related' && /Грузоперевозки/i.test(item.label))).toBe(true);
    expect(getRelatedSearchTerms('грузоперевозки')).toContain('логистика');
    expect(shouldHighlightToken('логистикой', ['грузоперевозки'])).toBe(true);
  });

  it('searches at least 500 profiles quickly and deterministically', () => {
    const profiles = Array.from({ length: 500 }, (_, index) => makeProfile(String(index), {
      name: `Участник ${index}`,
      city: index % 2 === 0 ? 'Санкт-Петербург' : 'Москва',
      occupation: index === 347 ? 'B2B продажи и CRM автоматизация' : 'Предприниматель',
      canHelpWith: index === 347 ? 'Помогу построить отдел продаж' : 'Обмен опытом',
      domains: index === 347 ? ['Продажи', 'IT / AI'] : ['Другое'],
    }));

    const startedAt = performance.now();
    const results = searchProfiles(profiles, 'B2B продажи CRM');
    const duration = performance.now() - startedAt;
    expect(results[0]?.profile.id).toBe('347');
    expect(duration).toBeLessThan(500);
  });
});
