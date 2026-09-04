import type { Profile } from '../types/profile';

function cleanPunctuation(value: string) {
  return value.replace(/^[\s:;,.!?—–-]+|[\s:;,.!?—–-]+$/g, '').replace(/\s+/g, ' ').trim();
}

export function cleanProfileName(value?: string): string | undefined {
  if (!value) return undefined;
  let cleaned = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  cleaned = cleaned.replace(/^\s*\d+\s*[.)-]?\s*/i, '');

  const questionAnswer = cleaned.match(/^(?:как\s+(?:тебя|вас)\s+зовут|как\s+зовут|ваше\s+имя|твое\s+имя|твоё\s+имя|имя(?:\s+и\s+фамилия)?|фио)\s*\??\s*[:—–-]*\s*(.+)$/i);
  if (questionAnswer?.[1]) cleaned = questionAnswer[1];

  cleaned = cleaned
    .replace(/^(?:как\s+(?:тебя|вас)\s+зовут|как\s+зовут|ваше\s+имя|твое\s+имя|твоё\s+имя|имя(?:\s+и\s+фамилия)?|фио)\s*\??\s*[:—–-]*/i, '')
    .replace(/^ответ\s*[:—–-]\s*/i, '')
    .replace(/^меня\s+зовут\s+/i, '')
    .replace(/^я\s*[-—–:]\s*/i, '');

  if (cleaned.includes('?')) {
    const afterQuestion = cleaned.split('?').at(-1);
    if (afterQuestion && cleanPunctuation(afterQuestion).length >= 2) cleaned = afterQuestion;
  }

  cleaned = cleanPunctuation(cleaned)
    .split(/[,;]\s*(?=(?:1[6-9]|[2-9]\d)\b)/)[0] ?? cleaned;
  cleaned = cleaned.replace(/\s+(?:мне\s*)?(?:1[6-9]|[2-9]\d)\s*(?:лет|год(?:а|ов)?)?\s*$/i, '').trim();

  // Имя не должно превращаться в целую анкету или ссылку.
  if (!cleaned || cleaned.length > 80 || /^https?:\/\//i.test(cleaned)) return undefined;
  return cleaned;
}

export function getProfileDisplayName(profile: Profile): string {
  return cleanProfileName(profile.name) ?? cleanProfileName(profile.telegramDisplayName) ?? profile.telegramDisplayName;
}

export function normalizeProfile(profile: Profile): Profile {
  const cleanName = cleanProfileName(profile.name);
  return cleanName && cleanName !== profile.name ? { ...profile, name: cleanName } : profile;
}
