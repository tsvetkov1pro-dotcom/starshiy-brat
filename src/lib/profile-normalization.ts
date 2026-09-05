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
  cleaned = cleaned.split(/\s+\d|[,;]|\s*\(/)[0]?.trim() ?? '';

  // Имя не должно превращаться в целую анкету или ссылку.
  if (!cleaned || cleaned.length > 80 || /^https?:\/\//i.test(cleaned)
    || cleaned.split(' ').length > 4
    || /розниц|пошив|производств|направлени|магазин|занимаюсь|работаю|продаж|строительств/i.test(cleaned)) return undefined;
  return cleaned;
}

export function extractProfileName(text: string): string | undefined {
  const normalized = text.replace(/1️⃣/g, '1.').replace(/2️⃣/g, '2.');
  const explicit = normalized.match(/(?:меня\s+зовут|(?:^|[\n.!?]\s*)зовут|как\s+(?:тебя|вас)\s+зовут\s*\??\s*[:—–-]*)\s*([^\n]+)/i)?.[1];
  const first = normalized.match(/(?:^|\s)1[.)]\s*([^\n]+)/)?.[1]
    ?? normalized.match(/(?:^|\n)\s*1\s+([^\n]+)/)?.[1];
  return cleanProfileName((explicit ?? first)?.split(/\s+[2-8][.)]\s*/)[0]);
}

function cleanFreeFormValue(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/^[\s:—–-]+|[\s.]+$/g, '').replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

function sectionValue(text: string, marker: RegExp): string | undefined {
  for (const block of text.split(/\n\s*\n|\n/)) {
    const value = block.match(marker)?.[1];
    if (value) return cleanFreeFormValue(value);
  }
  return undefined;
}

function normalizeCity(value?: string): string | undefined {
  const city = cleanFreeFormValue(value);
  if (!city) return undefined;
  const knownForms: Record<string, string> = {
    москвы: 'Москва',
    петербурга: 'Санкт-Петербург',
    'санкт-петербурга': 'Санкт-Петербург',
  };
  return knownForms[city.toLowerCase()] ?? city;
}

/** Extracts fields from free-form introductions that do not use the numbered template. */
export function extractFreeFormProfileFields(text: string): Partial<Profile> {
  const identity = text.match(/(?:^|[\n.!?]\s*)зовут\s+[^,\n.]+\s*,?\s*([^\n.]*)/i)?.[1];
  const city = normalizeCity(identity?.match(/из\s+([А-ЯЁ][А-ЯЁа-яё-]+(?:\s+[А-ЯЁ][а-яё-]+)?)/i)?.[1]);
  const ageMatch = text.match(/(?:^|\D)(1[6-9]|[2-9]\d)\s*(?:лет|года?|год)(?=\s|[.,!?]|$)/i);

  const labeledOccupation = sectionValue(text, /^(?:чем\s+занимаюсь|занимаюсь|деятельность|профессия|бизнес)\s*[:—–-]\s*(.+)$/i);
  const workSentence = text.split('\n').map((line) => line.trim()).find((line) => /(?:работаю|занимаюсь)/i.test(line));
  const inferredOccupation = cleanFreeFormValue(
    workSentence
      ?.replace(/^последние\s+.{1,40}?\s+лет\s+/i, '')
      .replace(/^(?:я\s+)?работаю\s+на\s+себя\s*[,—–-]?\s*/i, '')
      .replace(/^(?:я\s+)?(?:работаю|занимаюсь)\s*[:—–-]?\s*/i, ''),
  );

  const name = extractProfileName(text);
  const occupation = labeledOccupation ?? inferredOccupation;
  const currentChallenge = sectionValue(text, /^(?:самое\s+тяж[её]лое(?:\s+сейчас)?|текущая\s+(?:задача|сложность)|сейчас\s+сложно)\s*[:—–-]?\s*(.+)$/i);
  const currentPriority = sectionValue(text, /^(?:самое\s+важное(?:\s+сейчас)?|сейчас\s+важно|приоритет)\s*[:—–-]?\s*(.+)$/i);
  const goal90Days = sectionValue(text, /^(?:результат\s+через\s+90\s+дней|цель\s+на\s+90\s+дней|через\s+90\s+дней)\s*[:—–-]?\s*(.+)$/i);
  const canHelpWith = sectionValue(text, /^(?:могу\s+быть\s+полез(?:ен|на)|чем\s+могу\s+помочь|могу\s+помочь)\s*[:—–-]?\s*(.+)$/i);

  return {
    ...(name ? { name } : {}),
    ...(city ? { city } : {}),
    ...(ageMatch ? { age: Number(ageMatch[1]) } : {}),
    ...(occupation ? { occupation } : {}),
    ...(currentChallenge ? { currentChallenge } : {}),
    ...(currentPriority ? { currentPriority } : {}),
    ...(goal90Days ? { goal90Days } : {}),
    ...(canHelpWith ? { canHelpWith } : {}),
  };
}

export function getProfileDisplayName(profile: Profile): string {
  return extractProfileName(profile.rawProfileText) ?? cleanProfileName(profile.name) ?? cleanProfileName(profile.telegramDisplayName) ?? profile.telegramDisplayName;
}

export function normalizeProfile(profile: Profile): Profile {
  const inferred = extractFreeFormProfileFields(profile.rawProfileText);
  const cleanName = inferred.name ?? cleanProfileName(profile.name) ?? cleanProfileName(profile.telegramDisplayName);
  return {
    ...profile,
    ...(cleanName ? { name: cleanName } : {}),
    ...(!profile.city && inferred.city ? { city: inferred.city } : {}),
    ...(profile.age === undefined && inferred.age !== undefined ? { age: inferred.age } : {}),
    ...(!profile.occupation && inferred.occupation ? { occupation: inferred.occupation } : {}),
    ...(!profile.currentChallenge && inferred.currentChallenge ? { currentChallenge: inferred.currentChallenge } : {}),
    ...(!profile.currentPriority && inferred.currentPriority ? { currentPriority: inferred.currentPriority } : {}),
    ...(!profile.goal90Days && inferred.goal90Days ? { goal90Days: inferred.goal90Days } : {}),
    ...(!profile.canHelpWith && inferred.canHelpWith ? { canHelpWith: inferred.canHelpWith } : {}),
  };
}

