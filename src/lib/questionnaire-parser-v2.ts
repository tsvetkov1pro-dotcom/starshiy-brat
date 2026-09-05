import type { Profile } from '../types/profile';
import { cleanProfileName } from './profile-normalization';

export const PROFILE_PARSER_VERSION = '3.0.0';

type SemanticField = 'occupation' | 'currentChallenge' | 'currentPriority' | 'goal90Days' | 'canHelpWith';

interface Segment {
  number: number;
  lines: string[];
  text: string;
}

export interface ParsedQuestionnaireFields {
  name?: string;
  city?: string;
  age?: number;
  occupation?: string;
  currentChallenge?: string;
  currentPriority?: string;
  goal90Days?: string;
  canHelpWith?: string;
  layout: 'canonical-8' | 'legacy-shifted' | 'partial';
}

const FIELD_SIGNALS: Record<SemanticField, RegExp[]> = {
  occupation: [
    /\bзанима(?:юсь|ется|емся)\b/i,
    /\bработа(?:ю|ет|ем)\b/i,
    /\bпредпринимател/i,
    /\bосновн\w*\s+направлен/i,
    /\bразвива(?:ю|ет)\b/i,
    /\bбизнес\b/i,
    /\bкомпан/i,
    /\bателье\b/i,
    /\bпроизводств/i,
    /\bстроительств/i,
    /\bнедвижимост/i,
    /\bгрузоперевоз/i,
    /\bмаркетинг/i,
    /\bпродаж/i,
    /\bразработ/i,
    /\bфинанс/i,
    /\bюрист/i,
    /\bдизайн/i,
    /\bлогист/i,
    /\bконсалт/i,
    /\bсво[её]\s+дело\b/i,
  ],
  currentChallenge: [
    /сам(?:ое|ый|ая)\s+тяж/i,
    /\bтяж[её]л/i,
    /\bсложн/i,
    /\bпроблем/i,
    /\bвызов/i,
    /не\s+утонуть/i,
    /не\s+получается/i,
    /\bмешает\b/i,
    /\bупираюсь\b/i,
    /\bтрудн/i,
  ],
  currentPriority: [
    /сам(?:ое|ый|ая)\s+важ/i,
    /\bсейчас\s+важ/i,
    /\bприоритет/i,
    /\bфокус/i,
    /\bсейчас\s+хочу\b/i,
  ],
  goal90Days: [
    /90\s*дн/i,
    /через\s+90/i,
    /\b3\s*месяц/i,
    /\bтри\s+месяц/i,
    /буду\s+горд/i,
    /результат(?:ом)?\s+.*горд/i,
  ],
  canHelpWith: [
    /могу\s+помочь/i,
    /могу\s+быть\s+полез/i,
    /\bпомогу\b/i,
    /могу\s+подсказ/i,
    /могу\s+познаком/i,
    /могу\s+найти/i,
    /могу\s+организ/i,
    /готов\s+помочь/i,
    /есть\s+опыт/i,
    /есть\s+контакт/i,
    /есть\s+подрядчик/i,
    /есть\s+специалист/i,
    /для\s+участник/i,
  ],
};

function normalizeSpace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function normalizeEmojiDigits(value: string): string {
  return value
    .replaceAll('1️⃣', '1')
    .replaceAll('2️⃣', '2')
    .replaceAll('3️⃣', '3')
    .replaceAll('4️⃣', '4')
    .replaceAll('5️⃣', '5')
    .replaceAll('6️⃣', '6')
    .replaceAll('7️⃣', '7')
    .replaceAll('8️⃣', '8');
}

function cleanAnswer(value?: string): string | undefined {
  if (!value) return undefined;
  const lines = value
    .split('\n')
    .map((line) => normalizeSpace(line).replace(/^[+•]\s*/, ''))
    .filter(Boolean);
  if (!lines.length) return undefined;
  return lines.join('\n').trim() || undefined;
}

function parseAge(value?: string): number | undefined {
  if (!value) return undefined;
  const explicit = value.match(/\b(1[6-9]|[2-9]\d)\s*(?:лет|год(?:а|ов)?)\b/i);
  const loose = value.match(/\b(1[6-9]|[2-9]\d)\b/);
  const number = Number((explicit ?? loose)?.[1]);
  return Number.isFinite(number) && number >= 16 && number <= 100 ? number : undefined;
}

function segmentText(rawText: string): { segments: Segment[]; freeHelp: string[] } {
  const values = new Map<number, string[]>();
  const freeHelp: string[] = [];
  let currentNumber: number | undefined;

  for (const rawLine of normalizeEmojiDigits(rawText).split('\n')) {
    const line = normalizeSpace(rawLine);
    if (!line) continue;

    const marker = line.match(/^([1-8])(?:\s*[-–—/]\s*([1-8]))?(?:[.)]\s*|\s+)(.*)$/);
    if (marker) {
      const start = Number(marker[1]);
      const end = marker[2] ? Number(marker[2]) : start;
      currentNumber = start;
      const rest = normalizeSpace(marker[3] ?? '');
      for (let key = Math.min(start, end); key <= Math.max(start, end); key += 1) {
        if (!values.has(key)) values.set(key, []);
        if (rest) values.get(key)?.push(rest);
      }
      continue;
    }

    const bullet = /^[+•]\s*/.test(line);
    if (bullet && currentNumber !== 8 && (currentNumber === undefined || currentNumber >= 6)) {
      freeHelp.push(line.replace(/^[+•]\s*/, '').trim());
      continue;
    }

    if (currentNumber !== undefined) {
      if (!values.has(currentNumber)) values.set(currentNumber, []);
      values.get(currentNumber)?.push(line);
    }
  }

  const segments = Array.from(values.entries())
    .map(([number, lines]) => ({ number, lines, text: cleanAnswer(lines.join('\n')) ?? '' }))
    .filter((segment) => segment.text);

  return { segments, freeHelp: freeHelp.filter(Boolean) };
}

function signalCount(field: SemanticField, text: string): number {
  return FIELD_SIGNALS[field].reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function scoreSegment(
  field: SemanticField,
  segment: Segment,
  expectedNumber: number,
  alternateNumber?: number,
): number {
  let score = segment.number === expectedNumber ? 7 : segment.number === alternateNumber ? 2 : 0;
  score += signalCount(field, segment.text) * 5;

  for (const other of Object.keys(FIELD_SIGNALS) as SemanticField[]) {
    if (other === field) continue;
    const otherSignals = signalCount(other, segment.text);
    if (!otherSignals) continue;
    score -= otherSignals * (other === 'canHelpWith' ? 3 : 4);
  }

  return score;
}

function chooseSegment(
  field: SemanticField,
  segments: Segment[],
  expectedNumber: number,
  alternateNumber?: number,
): string | undefined {
  let best: { score: number; text?: string } = { score: -Infinity };
  for (const segment of segments) {
    const score = scoreSegment(field, segment, expectedNumber, alternateNumber);
    if (score > best.score) best = { score, text: segment.text };
  }
  return best.score >= 4 ? cleanAnswer(best.text) : undefined;
}

function uniqueHelpLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines.map((item) => cleanAnswer(item)).filter((item): item is string => Boolean(item))) {
    const key = line.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}

function inferHelp(rawText: string, segments: Segment[], freeHelp: string[]): string | undefined {
  const segment8 = segments.find((segment) => segment.number === 8)?.text;
  if (segment8) return cleanAnswer(segment8);

  const bulletHelp = uniqueHelpLines(freeHelp);
  if (bulletHelp.length) return bulletHelp.join('\n');

  const semanticLines = rawText
    .split('\n')
    .map(normalizeSpace)
    .filter(Boolean)
    .filter((line) => signalCount('canHelpWith', line) > 0)
    .map((line) => line.replace(/^[+•-]\s*/, ''));
  const unique = uniqueHelpLines(semanticLines);
  return unique.length ? unique.join('\n') : undefined;
}

function validateSemanticField(field: SemanticField, value?: string): string | undefined {
  if (!value) return undefined;
  if (field === 'occupation' && (
    signalCount('currentChallenge', value) > 0
    || signalCount('currentPriority', value) > 0
    || signalCount('goal90Days', value) > 0
  ) && signalCount('occupation', value) === 0) return undefined;
  if (field === 'currentChallenge' && signalCount('occupation', value) > 0 && signalCount('currentChallenge', value) === 0) return undefined;
  if (field === 'goal90Days' && signalCount('currentChallenge', value) > 0 && signalCount('goal90Days', value) === 0) return undefined;
  return cleanAnswer(value);
}

export function parseQuestionnaireV2(rawText: string): ParsedQuestionnaireFields {
  const { segments, freeHelp } = segmentText(rawText);
  const byNumber = new Map(segments.map((segment) => [segment.number, segment.text]));

  const ageIn1 = parseAge(byNumber.get(1));
  const ageIn3 = parseAge(byNumber.get(3));
  const hasCanonicalTail = Boolean(byNumber.get(7) || byNumber.get(8));
  const legacyShifted = Boolean(ageIn1 && !ageIn3 && byNumber.get(3) && !hasCanonicalTail);

  const nameSource = byNumber.get(1)?.replace(/\b(1[6-9]|[2-9]\d)\s*(?:лет|год(?:а|ов)?)\b[.,;]?/gi, '').trim();
  const name = cleanProfileName(nameSource);
  const city = cleanAnswer(byNumber.get(2));
  const age = ageIn3 ?? ageIn1 ?? parseAge(rawText);

  const occupationNumber = legacyShifted ? 3 : 4;
  const challengeNumber = legacyShifted ? 4 : 5;
  const priorityNumber = legacyShifted ? 5 : 6;
  const goalNumber = legacyShifted ? 6 : 7;

  const occupation = validateSemanticField(
    'occupation',
    chooseSegment('occupation', segments, occupationNumber, occupationNumber === 4 ? 3 : 4),
  );
  const currentChallenge = validateSemanticField(
    'currentChallenge',
    chooseSegment('currentChallenge', segments, challengeNumber, challengeNumber === 5 ? 4 : 5),
  );
  const currentPriority = validateSemanticField(
    'currentPriority',
    chooseSegment('currentPriority', segments, priorityNumber, priorityNumber === 6 ? 5 : 6),
  );
  const goal90Days = validateSemanticField(
    'goal90Days',
    chooseSegment('goal90Days', segments, goalNumber, goalNumber === 7 ? 6 : 7),
  );
  const canHelpWith = validateSemanticField('canHelpWith', inferHelp(rawText, segments, freeHelp));

  return {
    ...(name ? { name } : {}),
    ...(city ? { city } : {}),
    ...(age !== undefined ? { age } : {}),
    ...(occupation ? { occupation } : {}),
    ...(currentChallenge ? { currentChallenge } : {}),
    ...(currentPriority ? { currentPriority } : {}),
    ...(goal90Days ? { goal90Days } : {}),
    ...(canHelpWith ? { canHelpWith } : {}),
    layout: legacyShifted ? 'legacy-shifted' : hasCanonicalTail ? 'canonical-8' : 'partial',
  };
}

export function reparseProfileV2(profile: Profile): Profile {
  const parsed = parseQuestionnaireV2(profile.rawProfileText);
  return {
    ...profile,
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.city ? { city: parsed.city } : {}),
    ...(parsed.age !== undefined ? { age: parsed.age } : {}),
    ...(parsed.occupation ? { occupation: parsed.occupation } : {}),
    ...(parsed.currentChallenge ? { currentChallenge: parsed.currentChallenge } : {}),
    ...(parsed.currentPriority ? { currentPriority: parsed.currentPriority } : {}),
    ...(parsed.goal90Days ? { goal90Days: parsed.goal90Days } : {}),
    ...(parsed.canHelpWith ? { canHelpWith: parsed.canHelpWith } : {}),
    parserVersion: PROFILE_PARSER_VERSION,
  };
}
