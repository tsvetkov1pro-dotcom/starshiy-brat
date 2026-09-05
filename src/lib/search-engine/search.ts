import type { Profile } from '../../types/profile';
import { getProfileDisplayName } from '../profile-normalization';

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
  semantic?: boolean;
}

export interface SearchExcerpt {
  field: SearchField;
  label: string;
  text: string;
}

export interface SearchResult {
  profile: Profile;
  score: number;
  reasons: SearchMatchReason[];
  highlightTerms: string[];
  excerpt?: SearchExcerpt;
}

export interface SearchOptions {
  limit?: number;
}

export type SearchSuggestionType = 'person' | 'domain' | 'challenge' | 'related';

export interface SearchSuggestion {
  id: string;
  type: SearchSuggestionType;
  label: string;
  subtitle?: string;
  value: string;
  profileId?: string;
}

interface SemanticGroup {
  label: string;
  roots: string[];
  terms: string[];
}

const STOP_WORDS = new Set([
  'кто', 'что', 'где', 'как', 'мне', 'мой', 'моя', 'мои', 'нужен', 'нужна', 'нужно',
  'может', 'могут', 'помочь', 'поможет', 'занимается', 'занимаются', 'работает', 'работают',
  'есть', 'среди', 'братьев', 'брата', 'человек', 'людей', 'из', 'для', 'про', 'под', 'над',
  'или', 'это', 'тот', 'который', 'которая', 'которые', 'с', 'со', 'в', 'во', 'на', 'по', 'и', 'а',
]);

// Лёгкий локальный stemmer. Он не пытается «угадать факт», а только сводит русские словоформы
// к устойчивой основе для полнотекстового поиска.
const SUFFIXES = [
  'иями', 'ями', 'ами', 'ией', 'ией', 'ого', 'ему', 'ому', 'ыми', 'ими', 'иях', 'ах', 'ях',
  'ирование', 'ирования', 'ировать', 'ироваться', 'изация', 'изации', 'ировать', 'овать', 'евать',
  'ение', 'ения', 'ений', 'ание', 'ания', 'аний', 'ость', 'ости', 'остями',
  'овой', 'евой', 'овый', 'евый', 'ский', 'ская', 'ское', 'ские', 'ских',
  'ов', 'ев', 'ей', 'ий', 'ый', 'ой', 'ая', 'яя', 'ое', 'ее', 'ом', 'ем', 'ам', 'ям', 'ую', 'юю',
  'а', 'я', 'ы', 'и', 'е', 'у', 'ю', 'ь',
].sort((a, b) => b.length - a.length);

const ALIASES: Record<string, string[]> = {
  питер: ['санкт', 'петербург'],
  спб: ['санкт', 'петербург'],
  ии: ['ai', 'нейросет', 'искусственн интеллект'],
  аи: ['ai'],
  нейронк: ['нейросет', 'ai'],
  клиент: ['лид', 'заказчик'],
};

const SEMANTIC_GROUPS: SemanticGroup[] = [
  {
    label: 'Грузоперевозки и логистика',
    roots: ['груз', 'перевоз', 'логист', 'достав', 'транспорт', 'экспед'],
    terms: ['грузоперевозки', 'перевозка грузов', 'перевозки', 'перевозчик', 'логистика', 'доставка', 'грузовой транспорт', 'транспортная компания', 'экспедирование', 'экспедитор'],
  },
  {
    label: 'Продажи',
    roots: ['продаж', 'переговор', 'коммерц', 'b2b', 'конверс', 'лид'],
    terms: ['продажи', 'отдел продаж', 'B2B', 'переговоры', 'коммерция', 'конверсия', 'лиды', 'закрытие сделок'],
  },
  {
    label: 'Маркетинг и реклама',
    roots: ['маркет', 'реклам', 'трафик', 'лидоген', 'smm', 'seo', 'авито'],
    terms: ['маркетинг', 'реклама', 'трафик', 'лидогенерация', 'SMM', 'SEO', 'Авито', 'привлечение клиентов'],
  },
  {
    label: 'IT / AI',
    roots: ['ai', 'ии', 'нейросет', 'разработ', 'програм', 'автоматиз', 'crm', 'llm'],
    terms: ['AI', 'ИИ', 'нейросети', 'искусственный интеллект', 'разработка', 'программирование', 'автоматизация', 'CRM', 'LLM', 'ChatGPT'],
  },
  {
    label: 'Строительство',
    roots: ['строит', 'строй', 'ремонт', 'подряд', 'архитект', 'девелоп'],
    terms: ['строительство', 'стройка', 'ремонт', 'подряд', 'архитектура', 'девелопмент', 'дизайн интерьеров'],
  },
  {
    label: 'Финансы',
    roots: ['финанс', 'бухгал', 'инвест', 'cfo', 'долг', 'кредит', 'кассов'],
    terms: ['финансы', 'бухгалтерия', 'инвестиции', 'CFO', 'финансовый директор', 'долги', 'кредиты', 'кассовый разрыв'],
  },
  {
    label: 'Производство',
    roots: ['производ', 'фабрик', 'завод', 'цех', 'мебел', 'пошив', 'текстил'],
    terms: ['производство', 'фабрика', 'завод', 'цех', 'мебель', 'пошив', 'текстиль'],
  },
  {
    label: 'Недвижимость',
    roots: ['недвиж', 'риелтор', 'риэлтор', 'аренд', 'девелоп'],
    terms: ['недвижимость', 'риелтор', 'риэлтор', 'аренда', 'девелопмент'],
  },
  {
    label: 'Здоровье и спорт',
    roots: ['здоров', 'спорт', 'фитнес', 'тренер', 'медицин', 'врач', 'психолог'],
    terms: ['здоровье', 'спорт', 'фитнес', 'тренер', 'медицина', 'врач', 'психология'],
  },
];

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
  const normalized = normalize(token);
  if (/^[a-z0-9+#/.-]+$/i.test(normalized)) return normalized;
  if (normalized.length < 5) return normalized;
  for (const suffix of SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length - suffix.length >= 3) {
      return normalized.slice(0, -suffix.length);
    }
  }
  return normalized;
}

function tokenize(value: string, expandAliases = false): string[] {
  const rawTokens = normalize(value).split(' ').filter(Boolean);
  const result = rawTokens
    .filter((token) => !STOP_WORDS.has(token))
    .map(stem)
    .filter(Boolean);

  if (expandAliases) {
    for (const raw of rawTokens) {
      const keys = new Set([raw, stem(raw)]);
      for (const key of keys) {
        for (const alias of ALIASES[key] ?? []) {
          for (const aliasToken of normalize(alias).split(' ')) result.push(stem(aliasToken));
        }
      }
    }
  }

  return [...new Set(result)];
}

function tokenMatches(stemmedWord: string, candidates: Iterable<string>): boolean {
  for (const candidate of candidates) {
    if (stemmedWord === candidate) return true;
    if (stemmedWord.length >= 4 && candidate.length >= 4 && stemmedWord.startsWith(candidate)) return true;
  }
  return false;
}

function groupMatchesQuery(group: SemanticGroup, queryTokens: string[], normalizedQuery: string): boolean {
  if (group.terms.some((term) => normalize(term) === normalizedQuery || normalize(term).includes(normalizedQuery) && normalizedQuery.length >= 4)) return true;
  return queryTokens.some((token) => group.roots.some((root) => tokenMatches(token, [root])));
}

function getQuerySpec(query: string) {
  const normalizedQuery = normalize(query);
  const directTokens = tokenize(query, true);
  const expandedTokens = new Set(directTokens);
  const groups = SEMANTIC_GROUPS.filter((group) => groupMatchesQuery(group, directTokens, normalizedQuery));

  for (const group of groups) {
    for (const root of group.roots) expandedTokens.add(stem(root));
    for (const term of group.terms) {
      for (const token of tokenize(term, true)) expandedTokens.add(token);
    }
  }

  return { normalizedQuery, directTokens, expandedTokens: [...expandedTokens], groups };
}

function fieldText(profile: Profile, field: SearchField): string {
  const value = profile[field];
  return Array.isArray(value) ? value.join(' ') : String(value ?? '');
}

const FIELD_WEIGHTS: Array<[SearchField, number, string]> = [
  ['name', 380, 'Имя'],
  ['telegramDisplayName', 350, 'Имя в Telegram'],
  ['telegramUsername', 330, 'Telegram username'],
  ['canHelpWith', 190, 'Чем может помочь'],
  ['occupation', 165, 'Чем занимается'],
  ['domains', 125, 'Сфера'],
  ['challenges', 115, 'Вызов'],
  ['city', 95, 'Город'],
  ['currentChallenge', 88, 'Текущий вызов'],
  ['currentPriority', 72, 'Что сейчас важно'],
  ['goal90Days', 68, 'Цель на 90 дней'],
  ['searchKeywords', 45, 'Ключевые слова'],
  ['rawProfileText', 20, 'Текст визитки'],
];

const EXCERPT_PRIORITY: SearchField[] = [
  'canHelpWith', 'occupation', 'currentChallenge', 'currentPriority', 'goal90Days', 'rawProfileText',
];

function originalWords(value: string): Array<{ raw: string; stem: string }> {
  return (value.match(/[A-Za-zА-Яа-яЁё0-9+#/.-]+/g) ?? []).map((raw) => ({ raw, stem: stem(raw) }));
}

function matchWords(text: string, query: ReturnType<typeof getQuerySpec>) {
  const direct: string[] = [];
  const semantic: string[] = [];

  for (const word of originalWords(text)) {
    if (tokenMatches(word.stem, query.directTokens)) direct.push(word.raw);
    else if (tokenMatches(word.stem, query.expandedTokens)) semantic.push(word.raw);
  }

  return { direct: [...new Set(direct)], semantic: [...new Set(semantic)] };
}

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

function makeExcerpt(profile: Profile, reasons: SearchMatchReason[]): SearchExcerpt | undefined {
  for (const field of EXCERPT_PRIORITY) {
    const reason = reasons.find((item) => item.field === field && item.matched.length > 0);
    if (!reason) continue;
    const text = fieldText(profile, field).trim();
    if (!text) continue;
    const first = reason.matched[0];
    const index = first ? normalize(text).indexOf(normalize(first)) : -1;
    if (text.length <= 240) return { field, label: reason.label, text };

    const rawIndex = index >= 0 ? Math.max(0, text.toLowerCase().indexOf(first.toLowerCase())) : 0;
    const start = Math.max(0, rawIndex - 70);
    const end = Math.min(text.length, rawIndex + 170);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < text.length ? '…' : '';
    return { field, label: reason.label, text: `${prefix}${text.slice(start, end).trim()}${suffix}` };
  }
  return undefined;
}

export function getRelatedSearchTerms(query: string): string[] {
  const spec = getQuerySpec(query);
  const result = new Set<string>();
  for (const token of normalize(query).split(' ').filter((item) => item.length >= 3)) result.add(token);
  for (const group of spec.groups) for (const term of group.terms) result.add(term);
  return [...result];
}

export function shouldHighlightToken(token: string, terms: string[]): boolean {
  if (!token || terms.length === 0) return false;
  const tokenStem = stem(token);
  const query = getQuerySpec(terms.join(' '));
  return tokenMatches(tokenStem, query.expandedTokens);
}

export function findProfileExcerptForTerms(profile: Profile, terms: string[]): SearchExcerpt | undefined {
  if (terms.length === 0) return undefined;
  const query = getQuerySpec(terms.join(' '));
  for (const [field, , label] of FIELD_WEIGHTS) {
    if (!EXCERPT_PRIORITY.includes(field)) continue;
    const text = fieldText(profile, field);
    const matched = matchWords(text, query);
    const all = [...matched.direct, ...matched.semantic];
    if (all.length === 0) continue;
    return makeExcerpt(profile, [{ field, label, matched: all, semantic: matched.direct.length === 0 }]);
  }
  return undefined;
}

export function searchProfiles(profiles: Profile[], query: string, options: SearchOptions = {}): SearchResult[] {
  const identityTokens = normalize(query).split(' ').filter(Boolean);
  const knownNames = new Set('владимир владислав влад роман святослав александр алексей антон андрей артем борис вадим валерий василий виктор виталий вячеслав георгий григорий даниил денис дмитрий евгений егор иван игорь илья кирилл константин леонид максим михаил никита николай олег павел петр руслан рустэм сергей семен станислав степан тимофей федор юрий ярослав'.split(' '));
  const isName = identityTokens.length > 0 && identityTokens.length <= 3 && (
    knownNames.has(identityTokens[0]) || profiles.some(profile => {
      const words = normalize(getProfileDisplayName(profile)).split(' ');
      return identityTokens.every(token => words.includes(token));
    })
  );
  if (isName) return searchProfilesByName(profiles, query).slice(0, options.limit ?? 50).map(profile => ({
    profile, score: 20_000, reasons: [{field:'exact', label:'Имя', matched:[getProfileDisplayName(profile)]}], highlightTerms: identityTokens,
  }));
  const spec = getQuerySpec(query);
  if (!spec.normalizedQuery || spec.directTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const profile of profiles) {
    const reasons: SearchMatchReason[] = [];
    const highlightTerms = new Set<string>();
    let score = 0;
    const covered = new Set<string>();

    const exact = exactIdentityScore(profile, spec.normalizedQuery);
    if (exact) {
      score += 20_000;
      reasons.push(exact);
      exact.matched.forEach((item) => highlightTerms.add(item));
    }

    for (const [field, weight, label] of FIELD_WEIGHTS) {
      const text = fieldText(profile, field);
      if (!text) continue;
      const matched = matchWords(text, spec);
      if (matched.direct.length === 0 && matched.semantic.length === 0) continue;

      for (const word of [...matched.direct, ...matched.semantic]) highlightTerms.add(word);
      for (const token of spec.directTokens) {
        if (originalWords(text).some((word) => tokenMatches(word.stem, [token]))) covered.add(token);
      }

      const directPoints = weight * Math.min(3, matched.direct.length);
      const semanticPoints = Math.round(weight * 0.48) * Math.min(3, matched.semantic.length);
      score += directPoints + semanticPoints;

      if (normalize(text).includes(spec.normalizedQuery) && spec.normalizedQuery.length >= 3) {
        score += Math.round(weight * 1.2);
      }

      reasons.push({
        field,
        label,
        matched: [...matched.direct, ...matched.semantic].slice(0, 8),
        semantic: matched.direct.length === 0 && matched.semantic.length > 0,
      });
    }

    if (covered.size === spec.directTokens.length && spec.directTokens.length > 1) score += 260;
    if (score > 0) {
      const excerpt = makeExcerpt(profile, reasons);
      results.push({ profile, score, reasons, highlightTerms: [...highlightTerms], ...(excerpt ? { excerpt } : {}) });
    }
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aName = a.profile.name ?? a.profile.telegramDisplayName;
      const bName = b.profile.name ?? b.profile.telegramDisplayName;
      return aName.localeCompare(bName, 'ru');
    })
    .slice(0, options.limit ?? 50);
}

export function getSearchSuggestions(profiles: Profile[], query: string, limit = 8): SearchSuggestion[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();
  const push = (suggestion: SearchSuggestion) => {
    const key = `${suggestion.type}:${normalize(suggestion.value)}`;
    if (seen.has(key) || suggestions.length >= limit) return;
    seen.add(key);
    suggestions.push(suggestion);
  };

  const spec = getQuerySpec(query);
  for (const group of spec.groups) {
    push({ id: `related:${group.label}`, type: 'related', label: group.label, subtitle: group.terms.slice(0, 4).join(' · '), value: group.terms[0] ?? group.label });
  }

  const domains = new Set(profiles.flatMap((profile) => profile.domains));
  const challenges = new Set(profiles.flatMap((profile) => profile.challenges));
  for (const domain of domains) {
    if (normalize(domain).includes(normalizedQuery) || getRelatedSearchTerms(query).some((term) => normalize(domain).includes(normalize(term)))) {
      push({ id: `domain:${domain}`, type: 'domain', label: domain, subtitle: 'Сфера сообщества', value: domain });
    }
  }
  for (const challenge of challenges) {
    if (normalize(challenge).includes(normalizedQuery)) {
      push({ id: `challenge:${challenge}`, type: 'challenge', label: challenge, subtitle: 'Похожий вызов', value: challenge });
    }
  }

  for (const result of searchProfiles(profiles, query, { limit: 5 })) {
    const name = getProfileDisplayName(result.profile);
    push({
      id: `person:${result.profile.id}`,
      type: 'person',
      label: name,
      subtitle: [result.profile.occupation, result.profile.city].filter(Boolean).join(' · ') || 'Участник сообщества',
      value: name,
      profileId: result.profile.id,
    });
  }

  return suggestions.slice(0, limit);
}

export const searchInternals = { normalize, stem, tokenize, getQuerySpec };

// Identity search never stems names or searches occupations and Telegram aliases.
export function searchProfilesByName(profiles: Profile[], query: string): Profile[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  return profiles.filter(profile => {
    const words = normalize(getProfileDisplayName(profile)).split(' ');
    return tokens.every(token => words.some(word => word === token || (token.length >= 2 && word.startsWith(token))));
  }).sort((a,b) => getProfileDisplayName(a).localeCompare(getProfileDisplayName(b), 'ru'));
}
