import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types/profile';
import { getSearchSuggestions, searchProfiles, searchProfilesByName } from './public-search';

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

describe('public identity search', () => {
  it('returns only Konstantins for an explicit Konstantin query', () => {
    const profiles = [
      makeProfile('maksim', { name: 'Максим Орлов', rawProfileText: 'Знаком с Константином и могу познакомить.' }),
      makeProfile('konstantin-1', { name: 'Константин Иванов', occupation: 'Строительство' }),
      makeProfile('konstantin-2', { name: 'Константин Петров', occupation: 'IT / AI' }),
      makeProfile('yuri', { name: 'Юрий Коновалов', rawProfileText: 'Работаю с Константином.' }),
    ];

    expect(searchProfiles(profiles, 'Константин').map((item) => item.profile.id))
      .toEqual(['konstantin-1', 'konstantin-2']);
  });

  it('treats Kostya as the common form of Konstantin without broad full-text matches', () => {
    const profiles = [
      makeProfile('konstantin', { name: 'Константин Смирнов' }),
      makeProfile('kostya', { name: 'Костя Лебедев' }),
      makeProfile('other', { name: 'Максим Котов', rawProfileText: 'Костя участвовал в проекте.' }),
    ];

    expect(searchProfilesByName(profiles, 'Костя').map((profile) => profile.id))
      .toEqual(['kostya', 'konstantin']);
    expect(searchProfiles(profiles, 'Костя').map((item) => item.profile.id))
      .toEqual(['kostya', 'konstantin']);
  });

  it('keeps autocomplete people in the same order as Enter results', () => {
    const profiles = [
      makeProfile('k3', { name: 'Константин Сидоров' }),
      makeProfile('k1', { name: 'Константин Алексеев' }),
      makeProfile('k2', { name: 'Константин Борисов' }),
      makeProfile('noise', { name: 'Максим', canHelpWith: 'Могу помочь Константину' }),
    ];

    const resultIds = searchProfiles(profiles, 'Константин').map((item) => item.profile.id);
    const suggestionIds = getSearchSuggestions(profiles, 'Константин', 20)
      .filter((item) => item.type === 'person')
      .map((item) => item.profileId);

    expect(suggestionIds).toEqual(resultIds);
    expect(resultIds).toEqual(['k1', 'k2', 'k3']);
  });

  it('supports partial name input without mixing in raw-text mentions', () => {
    const profiles = [
      makeProfile('konstantin', { name: 'Константин Иванов' }),
      makeProfile('other', { name: 'Геннадий', rawProfileText: 'Константин — мой партнёр.' }),
    ];

    expect(searchProfiles(profiles, 'Конст').map((item) => item.profile.id)).toEqual(['konstantin']);
  });
});
