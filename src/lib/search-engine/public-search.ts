import { getProfileDisplayName } from '../profile-normalization';
import type { Profile } from '../../types/profile';
import {
  getSearchSuggestions as baseGetSearchSuggestions,
  searchProfiles as baseSearchProfiles,
  type SearchOptions,
  type SearchResult,
  type SearchSuggestion,
} from './search';

const KNOWN_NAMES = new Set(
  'владимир владислав влад роман святослав александр алексей антон андрей артем борис вадим валерий василий виктор виталий вячеслав георгий григорий даниил денис дмитрий евгений егор иван игорь илья кирилл константин леонид максим михаил никита николай олег павел петр руслан рустэм сергей семен станислав степан тимофей федор юрий ярослав'.split(' '),
);

const NAME_ALIASES: Record<string, string> = {
  костя: 'константин',
  костик: 'константин',
  костян: 'константин',
};

function normalizeIdentity(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9-]+/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalNameToken(token: string): string {
  const normalized = normalizeIdentity(token);
  const direct = NAME_ALIASES[normalized];
  if (direct) return direct;

  if (normalized.length >= 3) {
    const alias = Object.entries(NAME_ALIASES).find(([short]) => short.startsWith(normalized));
    if (alias) return alias[1];
  }

  return normalized;
}

function canonicalTokens(value: string): string[] {
  return normalizeIdentity(value).split(' ').filter(Boolean).map(canonicalNameToken);
}

function profileNameTokens(profile: Profile): string[] {
  return canonicalTokens(getProfileDisplayName(profile));
}

function tokenMatchesName(queryToken: string, nameToken: string): boolean {
  if (queryToken === nameToken) return true;
  return queryToken.length >= 2 && nameToken.startsWith(queryToken);
}

function identityMatchScore(profile: Profile, query: string): number | undefined {
  const queryTokens = canonicalTokens(query);
  const nameTokens = profileNameTokens(profile);
  if (queryTokens.length === 0 || nameTokens.length === 0) return undefined;

  const allMatched = queryTokens.every((queryToken) => nameTokens.some((nameToken) => tokenMatchesName(queryToken, nameToken)));
  if (!allMatched) return undefined;

  const normalizedQuery = queryTokens.join(' ');
  const normalizedName = nameTokens.join(' ');
  if (normalizedName === normalizedQuery) return 30_000;

  let score = 20_000;
  for (const queryToken of queryTokens) {
    if (nameTokens.includes(queryToken)) score += 500;
    else score += 150;
  }

  if (nameTokens[0] === queryTokens[0]) score += 700;
  else if (nameTokens[0]?.startsWith(queryTokens[0] ?? '')) score += 350;
  return score;
}

function isIdentityQuery(profiles: Profile[], query: string): boolean {
  const rawTokens = normalizeIdentity(query).split(' ').filter(Boolean);
  if (rawTokens.length === 0 || rawTokens.length > 3) return false;

  const first = canonicalNameToken(rawTokens[0]);
  if (KNOWN_NAMES.has(first)) return true;
  return profiles.some((profile) => identityMatchScore(profile, query) !== undefined);
}

export function searchProfilesByName(profiles: Profile[], query: string): Profile[] {
  return profiles
    .map((profile) => ({ profile, score: identityMatchScore(profile, query) }))
    .filter((item): item is { profile: Profile; score: number } => item.score !== undefined)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return getProfileDisplayName(a.profile).localeCompare(getProfileDisplayName(b.profile), 'ru');
    })
    .map((item) => item.profile);
}

export function searchProfiles(profiles: Profile[], query: string, options: SearchOptions = {}): SearchResult[] {
  if (!isIdentityQuery(profiles, query)) return baseSearchProfiles(profiles, query, options);

  const limit = options.limit ?? 50;
  const rawTokens = normalizeIdentity(query).split(' ').filter(Boolean);
  const canonical = canonicalTokens(query);
  const highlightTerms = [...new Set([...rawTokens, ...canonical])];

  return searchProfilesByName(profiles, query).slice(0, limit).map((profile, index) => ({
    profile,
    score: 30_000 - index,
    reasons: [{ field: 'exact', label: 'Имя', matched: [getProfileDisplayName(profile)] }],
    highlightTerms,
  }));
}

export function getSearchSuggestions(profiles: Profile[], query: string, limit = 8): SearchSuggestion[] {
  if (!isIdentityQuery(profiles, query)) return baseGetSearchSuggestions(profiles, query, limit);

  return searchProfilesByName(profiles, query).slice(0, limit).map((profile) => {
    const name = getProfileDisplayName(profile);
    return {
      id: `person:${profile.id}`,
      type: 'person',
      label: name,
      subtitle: [profile.occupation, profile.city].filter(Boolean).join(' · ') || 'Участник сообщества',
      value: name,
      profileId: profile.id,
    };
  });
}
