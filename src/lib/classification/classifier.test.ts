import { describe, expect, it } from 'vitest';
import type { Profile } from '../../types/profile';
import { classifyProfile, countTags } from './classifier';

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'p1',
  telegramDisplayName: 'Иван',
  domains: [],
  challenges: [],
  searchKeywords: [],
  rawProfileText: '',
  avatarSeed: 'p1',
  ...overrides,
});

describe('profile classification', () => {
  it('supports multiple professional domains and exposes matched evidence', () => {
    const result = classifyProfile(
      makeProfile({
        occupation: 'Руководитель проектов по цифровизации производственных предприятий',
        canHelpWith: 'Помогаю внедрять CRM, автоматизацию и выстраивать B2B продажи',
      }),
    );

    expect(result.profile.domains).toEqual(expect.arrayContaining(['IT / AI', 'Производство', 'Продажи']));
    expect(result.domainEvidence.find((item) => item.tag === 'IT / AI')?.matches.length).toBeGreaterThan(0);
    expect(result.profile.searchKeywords).toContain('автоматизацию');
  });

  it('classifies multiple challenges from challenge fields', () => {
    const result = classifyProfile(
      makeProfile({
        occupation: 'Производство мебели',
        currentChallenge: 'Нужно найти клиентов, сейчас есть кассовый разрыв и долги',
        goal90Days: 'Масштабировать бизнес и выстроить системный отдел продаж',
      }),
    );

    expect(result.profile.challenges).toEqual(
      expect.arrayContaining(['Поиск клиентов', 'Кассовый разрыв', 'Долги / финансы', 'Масштабирование', 'Продажи']),
    );
    expect(result.profile.domains).toContain('Производство');
    expect(result.profile.domains).not.toContain('Финансы');
  });

  it('falls back to Другое when no professional rule is supported by source text', () => {
    const result = classifyProfile(makeProfile({ occupation: 'Коллекционер редких часов' }));
    expect(result.profile.domains).toEqual(['Другое']);
  });

  it('computes dynamic counts from actual profile tags', () => {
    const profiles = [
      makeProfile({ id: '1', domains: ['IT / AI', 'Продажи'] }),
      makeProfile({ id: '2', domains: ['IT / AI'] }),
      makeProfile({ id: '3', domains: ['Производство'] }),
    ];

    expect([...countTags(profiles, 'domains').entries()]).toEqual([
      ['IT / AI', 2],
      ['Продажи', 1],
      ['Производство', 1],
    ]);
  });
});
