import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types/profile';
import { recommendProfiles } from './recommend';

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

describe('recommendation engine', () => {
  const self = makeProfile('self', {
    city: 'Санкт-Петербург',
    occupation: 'Производство текстиля и CRM',
    currentChallenge: 'Нужно найти клиентов и масштабировать продажи',
    domains: ['Производство'],
    challenges: ['Поиск клиентов', 'Масштабирование'],
  });

  it('always excludes selected self', () => {
    const results = recommendProfiles({ selectedSelf: self, candidates: [self], selectedInterests: ['Производство'] });
    expect(results).toEqual([]);
  });

  it('ranks someone who can help with selected tasks above a merely similar profile', () => {
    const helper = makeProfile('helper', {
      city: 'Москва',
      occupation: 'Коммерческий директор',
      canHelpWith: 'Помогу найти клиентов и построить продажи для производства',
      domains: ['Продажи', 'Производство'],
      challenges: [],
    });
    const similar = makeProfile('similar', {
      city: 'Санкт-Петербург',
      occupation: 'Владелец производства',
      domains: ['Производство'],
      challenges: ['Масштабирование'],
    });

    const results = recommendProfiles({
      selectedSelf: self,
      candidates: [similar, helper],
      selectedInterests: ['Продажи'],
      selectedChallenges: ['Поиск клиентов'],
    });

    expect(results[0]?.profileId).toBe('helper');
    expect(results[0]?.reasons.some((reason) => reason.kind === 'can-help')).toBe(true);
    expect(results[0]?.reasons.every((reason) => reason.evidence.length > 0)).toBe(true);
  });

  it('uses labels instead of fake percentages', () => {
    const candidate = makeProfile('candidate', {
      city: 'Санкт-Петербург',
      domains: ['Производство'],
      challenges: ['Масштабирование'],
    });
    const [result] = recommendProfiles({ selectedSelf: self, candidates: [candidate] });
    expect(['high', 'relevant', 'similar']).toContain(result?.tier);
    expect(JSON.stringify(result)).not.toMatch(/%/);
  });
});
