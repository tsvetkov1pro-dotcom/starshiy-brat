import type { Profile } from '../../types/profile';

export type SearchField =
  | 'name'
  | 'telegramDisplayName'
  | 'telegramUsername'
  | 'city'
  | 'occupation'
  | 'canHelpWith'
  | 'domains'
  | 'challenges'
  | 'currentChallenge'
  | 'currentPriority'
  | 'goal90Days'
  | 'searchKeywords'
  | 'rawProfileText';

export interface SearchMatchReason {
  field: SearchField | 'exact';
  label: string;
  matched: string[];
}

export interface SearchResult {
  profile: Profile;
  score: number;
  reasons: SearchMatchReason[];
}

export interface SearchOptions {
  limit?: number;
}

const STOP_WORDS = new Set([
  'кто', 'что', 'где', 'как', 'мне', 'мой', 'моя', 'мои', 'нужен', 'нужна', 'нужно',
  'может', 'могут', 'помочь', 'поможет', 'занимается', 'занимаются', 'работает', 'работают',
  'есть', 'среди', 'братьев', 'брата', 'человек', 'людей', 'из', 'для', 'про', 'под', 'над',
  'или', 'это', 'тот', 'который', 'которая', 'которые', 'с', 'со', 'в', 'во', 'на', 'по', 'и', 'а',
]);

const SUFFIXES = [
  'иями', 'ями', 'ами', 'ого', 'ему', 'ому', 'ыми', 'ими', 'иях', 'ах', 'ях',
  'ение', 'ения', 'ений', 'ировать', 'овать', 'евой', 'овой', 'евый', 'овый',
  'ов', 'ев', 'ий', 'ый', 'ой', 'ая', 'яя', 'ое', 'ее', 'ом', 'ем', 'ам', 'ям',
  'у', 'ю', 'а', 'я', 'ы', 'и', 'е',
].sort((a, b) => b.length - a.length);

const ALIASES: Record<string, string[]> = {
  питер: ['санкт', 'петербург'],
  спб: ['санкт', 'петербург'],
  аи: ['ai'],
  ии: ['ai', 'ии'],
  нейронки: ['нейросет'],
  клиенты: ['клиент'],
  клиент: ['клиент'],
  продажами: ['продаж'],
  продаж: ['продаж'],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/^@/, '')
    .replace(/[^a-zа-я0-9+#/.-]+/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(token: string): string {
  if (/^[a-z0-9+#/.-]+$/i.test(token)) return token;
  if (token.length < 5) return token;
  for (const suffix of SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

function tokenize(value: string, expandAliases = false): string[] {
  const rawTokens = normalize(value).split(' ').filter(Boolean);
  const tokens = rawTokens
    .filter((token) => !STOP_WORDS.has(token))
    .map(stem);

  if (!expandAliases) return [...new Set(tokens)];

  const expanded = [...tokens];
  for (const raw of rawTokens) {
    const aliasKeys = new Set([raw, stem(raw)]);
    for (const key of aliasKeys) {
      for (const alias of ALIASES[key] ?? []) expanded.push(stem(alias));
    }
  }
  return [...new Set(expanded)];
}

function fieldText(profile: Profile, field: SearchField): string {
  const value = profile[field];
  return Array.isArray(value) ? value.join(' ') : String(value ?? '');
}

const FIELD_WEIGHTS: Array<[SearchField, number, string]> = [
  ['name', 320, 'Имя'],
  ['telegramDisplayName', 300, 'Имя в Telegram'],
  ['telegramUsername', 280, 'Telegram username'],
  ['canHelpWith', 140, 'Чем может помочь'],
  ['occupation', 120, 'Деятельность'],
  ['domains', 100, 'Сфера'],
  ['challenges', 95, 'Вызов'],
  ['city', 80, 'Город'],
  ['currentChallenge', 70, 'Текущий вызов'],
  ['currentPriority', 55, 'Что сейчас важно'],
  ['goal90Days', 50, 'Цель на 90 дней'],
  ['searchKeywords', 35, 'Ключевые слова'],
  ['rawProfileText', 12, 'Текст визитки'],
];

function exactIdentityScore(profile: Profile, normalizedQuery: string): SearchMatchReason | undefined {
  const candidates: Array<[string | undefined, string]> = [
    [profile.name, 'Точное имя'],
    [profile.telegramDisplayName, 'Точное имя в Telegram'],
    [profile.telegramUsername, 'Точный Telegram username'],
  ];

  for (const [value, label] of candidates) {
    if (value && normalize(value) === normalizedQuery) {
      return { field: 'exact', label, matched: [value] };
    }
  }
  return undefined;
}

export function searchProfiles(
  profiles: Profile[],
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(query, true);
  if (queryTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const profile of profiles) {
    const reasons: SearchMatchReason[] = [];
    let score = 0;
    const matchedQueryTokens = new Set<string>();

    const exact = exactIdentityScore(profile, normalizedQuery);
    if (exact) {
      score += 10_000;
      reasons.push(exact);
    }

    for (const [field, weight, label] of FIELD_WEIGHTS) {
      const text = fieldText(profile, field);
      if (!text) continue;
      const normalizedField = normalize(text);
      const fieldTokens = new Set(tokenize(text));
      const matched = queryTokens.filter(
        (token) => fieldTokens.has(token) || (token.length >= 4 && normalizedField.includes(token)),
      );
      if (matched.length === 0) continue;

      matched.forEach((token) => matchedQueryTokens.add(token));
      score += weight * matched.length;
      if (normalizedField.includes(normalizedQuery) && normalizedQuery.length >= 3) score += Math.round(weight * 0.75);
      reasons.push({ field, label, matched });
    }

    if (matchedQueryTokens.size === queryTokens.length && queryTokens.length > 1) score += 180;
    if (score > 0) results.push({ profile, score, reasons });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aName = a.profile.name ?? a.profile.telegramDisplayName;
    const bName = b.profile.name ?? b.profile.telegramDisplayName;
    return aName.localeCompare(bName, 'ru');
  });

  return results.slice(0, options.limit ?? 50);
}

export const searchInternals = { normalize, stem, tokenize };
