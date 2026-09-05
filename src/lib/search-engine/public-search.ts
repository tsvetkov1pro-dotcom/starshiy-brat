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

function rawTokens(value: string): string[] {
  return normalizeIdentity(value).split(' ').filter(Boolean);
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
  return rawTokens(value).map(canonicalNameToken);
}

function tokenMatchesName(queryToken: string, nameToken: string): boolean {
  if (queryToken === nameToken) return true;
  return queryToken.length >= 2 && nameToken.startsWith(queryToken);
}

function identityMatchScore(profile: Profile, query: string): number | undefined {
  const queryRaw = rawTokens(query);
  const queryCanonical = queryRaw.map(canonicalNameToken);
  const displayName = getProfileDisplayName(profile);
  const nameRaw = rawTokens(displayName);
  const nameCanonical = nameRaw.map(canonicalNameToken);
  if (queryCanonical.length === 0 || nameCanonical.length === 0) return undefined;

  const allMatched = queryCanonical.every((queryToken) => nameCanonical.some((nameToken) => tokenMatchesName(queryToken, nameToken)));
  if (!allMatched) return undefined;

  let score = 20_000;
  const rawPhrase = queryRaw.join(' ');
  const rawNamePhrase = nameRaw.join(' ');
  const canonicalPhrase = queryCanonical.join(' ');
  const canonicalNamePhrase = nameCanonical.join(' ');

  if (rawNamePhrase === rawPhrase) score += 12_000;
  else if (canonicalNamePhrase === canonicalPhrase) score += 8_000;

  for (let index = 0; index < queryCanonical.length; index += 1) {
    const raw = queryRaw[index];
    const canonical = queryCanonical[index];
    if (nameRaw.includes(raw)) score += 1_200;
    else if (nameRaw.some((token) => raw.length >= 2 && token.startsWith(raw))) score += 700;
    else if (nameCanonical.includes(canonical)) score += 400;
    else score += 120;
  }

  if (nameRaw[0] === queryRaw[0]) score += 1_000;
  else if (nameRaw[0]?.startsWith(queryRaw[0] ?? '')) score += 600;
  else if (nameCanonical[0] === queryCanonical[0]) score += 250;

  return score;
}

function isIdentityQuery(profiles: Profile[], query: string): boolean {
  const tokens = rawTokens(query);
  if (tokens.length === 0 || tokens.length > 3) return false;

  const first = canonicalNameToken(tokens[0]);
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
  const queryRaw = rawTokens(query);
  const canonical = canonicalTokens(query);
  const highlightTerms = [...new Set([...queryRaw, ...canonical])];

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
