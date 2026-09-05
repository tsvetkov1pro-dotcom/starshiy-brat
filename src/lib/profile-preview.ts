import type { Profile } from '../types/profile';
import { getProfileDisplayName } from './profile-normalization';

function cleanInline(value?: string): string {
  return (value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s•·—–-]+|[\s•·—–-]+$/g, '')
    .trim();
}

function compact(value: string, max = 190): string {
  if (value.length <= max) return value;
  const slice = value.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 90 ? lastSpace : slice.length).trim()}…`;
}

function rawCandidates(profile: Profile): string[] {
  const raw = profile.rawProfileText ?? '';
  return raw
    .split(/\r?\n|(?=\s[1-9][.)]\s)/)
    .map((line) => cleanInline(line.replace(/^\s*[1-9][.)]\s*/, '')))
    .map((line) => line.replace(/^(?:имя|фио|город|возраст|сфера|telegram|телеграм)\s*[:—–-]\s*/i, '').trim())
    .filter(Boolean);
}

export function getProfilePreviewText(profile: Profile): string | undefined {
  const displayName = cleanInline(getProfileDisplayName(profile)).toLowerCase();
  const excluded = new Set([
    displayName,
    cleanInline(profile.telegramDisplayName).toLowerCase(),
    cleanInline(profile.telegramUsername).toLowerCase().replace(/^@/, ''),
    cleanInline(profile.city).toLowerCase(),
    cleanInline(profile.occupation).toLowerCase(),
    ...profile.domains.map((item) => cleanInline(item).toLowerCase()),
  ].filter(Boolean));

  const structured = [
    profile.canHelpWith,
    profile.currentPriority,
    profile.currentChallenge,
    profile.goal90Days,
  ].map(cleanInline);

  const candidates = [...structured, ...rawCandidates(profile)];
  const useful = candidates.find((value) => {
    const normalized = value.toLowerCase().replace(/^@/, '');
    if (!normalized || excluded.has(normalized)) return false;
    if (normalized === 'другое' || normalized === 'не указано') return false;
    if (/^https?:\/\//i.test(value)) return false;
    if (/^(?:как тебя зовут|как вас зовут|ваше имя|твоё имя|твое имя)\??$/i.test(value)) return false;
    return value.length >= 18;
  });

  return useful ? compact(useful) : undefined;
}
