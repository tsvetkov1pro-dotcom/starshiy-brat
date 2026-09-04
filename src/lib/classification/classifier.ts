import type { Profile } from '../../types/profile';
import { CHALLENGE_RULES, DOMAIN_RULES, type ClassificationRule } from './rules';

export const CLASSIFICATION_VERSION = '1.0.0';

export interface ClassificationEvidence {
  tag: string;
  matches: string[];
}

export interface ClassifiedProfileResult {
  profile: Profile;
  domainEvidence: ClassificationEvidence[];
  challengeEvidence: ClassificationEvidence[];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\u00a0/g, ' ');
}

function classifyText(text: string, rules: ClassificationRule[]): ClassificationEvidence[] {
  const normalized = normalize(text);
  return rules.flatMap((rule) => {
    const matches = rule.patterns
      .filter(({ pattern }) => pattern.test(normalized))
      .map(({ label }) => label);
    return matches.length > 0 ? [{ tag: rule.tag, matches: [...new Set(matches)] }] : [];
  });
}

function professionalSource(profile: Profile): string {
  const explicit = [profile.occupation, profile.canHelpWith].filter(Boolean).join('\n');
  return explicit.trim() || profile.rawProfileText;
}

function challengeSource(profile: Profile): string {
  const explicit = [profile.currentChallenge, profile.currentPriority, profile.goal90Days]
    .filter(Boolean)
    .join('\n');
  return explicit.trim() || profile.rawProfileText;
}

const STOP_WORDS = new Set([
  'который',
  'которая',
  'которые',
  'сейчас',
  'могу',
  'может',
  'помочь',
  'занимаюсь',
  'занимается',
  'работаю',
  'работает',
  'очень',
  'также',
  'через',
  'будет',
  'чтобы',
]);

function tokenize(value: string): string[] {
  return normalize(value)
    .replace(/[^a-zа-я0-9+/#.-]+/giu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function buildSearchKeywords(profile: Profile, domains: string[], challenges: string[]): string[] {
  const source = [
    profile.name,
    profile.telegramDisplayName,
    profile.telegramUsername,
    profile.city,
    profile.occupation,
    profile.canHelpWith,
    profile.currentChallenge,
    profile.currentPriority,
    profile.goal90Days,
    ...domains,
    ...challenges,
  ]
    .filter(Boolean)
    .join(' ');

  return [...new Set(tokenize(source))].slice(0, 80);
}

export function classifyProfile(profile: Profile): ClassifiedProfileResult {
  const domainEvidence = classifyText(professionalSource(profile), DOMAIN_RULES);
  const challengeEvidence = classifyText(challengeSource(profile), CHALLENGE_RULES);
  const domains = domainEvidence.map(({ tag }) => tag);
  const challenges = challengeEvidence.map(({ tag }) => tag);

  if (domains.length === 0) domains.push('Другое');

  return {
    profile: {
      ...profile,
      domains,
      challenges,
      searchKeywords: buildSearchKeywords(profile, domains, challenges),
    },
    domainEvidence,
    challengeEvidence,
  };
}

export function classifyProfiles(profiles: Profile[]): Profile[] {
  return profiles.map((profile) => classifyProfile(profile).profile);
}

export function countTags(profiles: Profile[], key: 'domains' | 'challenges'): Map<string, number> {
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    for (const tag of new Set(profile[key])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')));
}
