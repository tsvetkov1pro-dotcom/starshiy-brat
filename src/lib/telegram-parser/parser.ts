import type { Profile } from '../../types/profile';
import type {
  ParsedTelegramMessage,
  TelegramAttachment,
  TelegramLink,
  TelegramParseResult,
  TelegramParseWarning,
} from './types';

const EMOJI_DIGITS: Record<string, string> = {
  '1️⃣': '1',
  '2️⃣': '2',
  '3️⃣': '3',
  '4️⃣': '4',
  '5️⃣': '5',
  '6️⃣': '6',
  '7️⃣': '7',
  '8️⃣': '8',
};

const TELEGRAM_HOSTS = new Set(['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me']);

function normalizeSpace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function normalizeEmojiDigits(value: string): string {
  let result = value;
  for (const [emoji, digit] of Object.entries(EMOJI_DIGITS)) {
    result = result.replaceAll(emoji, digit);
  }
  return result;
}

function extractTextPreservingBreaks(root: Element | null): string {
  if (!root) return '';
  const chunks: string[] = [];
  const blockTags = new Set(['DIV', 'P', 'BLOCKQUOTE', 'LI']);

  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      chunks.push(node.nodeValue ?? '');
      return;
    }
    if (node.nodeType !== 1) return;

    const element = node as Element;
    if (element.tagName === 'BR') {
      chunks.push('\n');
      return;
    }

    const block = blockTags.has(element.tagName);
    if (block && chunks.length && !chunks.at(-1)?.endsWith('\n')) chunks.push('\n');
    for (const child of Array.from(element.childNodes)) walk(child);
    if (block && !chunks.at(-1)?.endsWith('\n')) chunks.push('\n');
  };

  for (const child of Array.from(root.childNodes)) walk(child);

  return chunks
    .join('')
    .split('\n')
    .map(normalizeSpace)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function telegramUsernameFromHref(href: string): string | undefined {
  try {
    const url = new URL(href);
    if (!TELEGRAM_HOSTS.has(url.hostname.toLowerCase())) return undefined;
    const username = url.pathname.split('/').filter(Boolean)[0];
    return username && /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : undefined;
  } catch {
    return undefined;
  }
}

function extractLinks(textElement: Element | null): TelegramLink[] {
  if (!textElement) return [];
  const links: TelegramLink[] = [];

  for (const anchor of Array.from(textElement.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    const href = anchor.getAttribute('href')?.trim();
    if (!href) continue;
    const username = telegramUsernameFromHref(href);
    links.push({
      href,
      text: normalizeSpace(anchor.textContent ?? ''),
      ...(username ? { username } : {}),
    });
  }

  return links;
}

function hasSelfContactContext(anchor: HTMLAnchorElement): boolean {
  const parent = anchor.parentElement;
  if (!parent) return false;
  const siblings = Array.from(parent.childNodes);
  const index = siblings.indexOf(anchor);
  const nearby = siblings
    .slice(Math.max(0, index - 3), Math.min(siblings.length, index + 4))
    .map((node) => node.textContent ?? '')
    .join(' ')
    .toLowerCase();

  return /(мой\s+(?:тг|телеграм|telegram)|для\s+связи|связаться\s+со\s+мной|пишите\s+мне|написать\s+мне|мой\s+аккаунт)/i.test(nearby);
}

function resolveAuthorUsername(messageElement: Element): string | undefined {
  const fromAnchor = messageElement.querySelector<HTMLAnchorElement>('.from_name a[href]');
  if (fromAnchor) {
    const username = telegramUsernameFromHref(fromAnchor.getAttribute('href') ?? '');
    if (username) return username;
  }

  for (const anchor of Array.from(messageElement.querySelectorAll<HTMLAnchorElement>('.text a[href]'))) {
    const username = telegramUsernameFromHref(anchor.getAttribute('href') ?? '');
    if (username && hasSelfContactContext(anchor)) return username;
  }

  return undefined;
}

function extractAttachments(messageElement: Element): TelegramAttachment[] {
  const attachments: TelegramAttachment[] = [];

  for (const photo of Array.from(messageElement.querySelectorAll<HTMLAnchorElement>('a.photo_wrap[href]'))) {
    const href = photo.getAttribute('href') ?? undefined;
    const previewSrc = photo.querySelector<HTMLImageElement>('img.photo')?.getAttribute('src') ?? undefined;
    attachments.push({ kind: 'photo', included: true, ...(href ? { href } : {}), ...(previewSrc ? { previewSrc } : {}) });
  }

  for (const placeholder of Array.from(messageElement.querySelectorAll<HTMLElement>('.media_photo'))) {
    const title = normalizeSpace(placeholder.querySelector('.title')?.textContent ?? '') || undefined;
    const description = normalizeSpace(placeholder.querySelector('.description')?.textContent ?? '') || undefined;
    const status = normalizeSpace(placeholder.querySelector('.status')?.textContent ?? '') || undefined;
    attachments.push({
      kind: 'photo',
      included: false,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(status ? { status } : {}),
    });
  }

  for (const file of Array.from(messageElement.querySelectorAll<HTMLAnchorElement>('a.file_wrap[href]'))) {
    const href = file.getAttribute('href') ?? undefined;
    attachments.push({ kind: 'file', included: true, ...(href ? { href } : {}) });
  }

  return attachments;
}

function isTemplateMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('для знакомства предлагаю') && lower.includes('как тебя зовут');
}

function questionnaireMarkerCount(text: string): number {
  return normalizeEmojiDigits(text)
    .split('\n')
    .filter((line) => /^\s*[1-8](?:\s*[-–—/]\s*[1-8])?\s*[.)]?\s*\S/.test(line)).length;
}

function isProfileLike(text: string): boolean {
  if (!text || isTemplateMessage(text)) return false;
  if (questionnaireMarkerCount(text) >= 3) return true;
  const lower = text.toLowerCase();
  if ((lower.includes('#знакомство') || lower.includes('#знакомоство')) && text.length >= 100) return true;
  return /меня\s+зовут/i.test(text) && /\b\d{2}\s*(?:лет|года?)\b/i.test(text);
}

function segmentQuestionnaire(text: string): Map<number, string> {
  const values = new Map<number, string[]>();
  let currentKeys: number[] = [];

  for (const rawLine of normalizeEmojiDigits(text).split('\n')) {
    const line = normalizeSpace(rawLine);
    if (!line) continue;
    const match = line.match(/^([1-8])(?:\s*[-–—/]\s*([1-8]))?\s*[.)]?\s*(.*)$/);

    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : start;
      currentKeys = [];
      for (let key = Math.min(start, end); key <= Math.max(start, end); key += 1) {
        currentKeys.push(key);
        if (!values.has(key)) values.set(key, []);
      }
      const rest = normalizeSpace(match[3] ?? '');
      if (rest) currentKeys.forEach((key) => values.get(key)?.push(rest));
      continue;
    }

    if (currentKeys.length) currentKeys.forEach((key) => values.get(key)?.push(line));
  }

  return new Map(Array.from(values.entries()).map(([key, parts]) => [key, normalizeSpace(parts.join(' '))]));
}

function cleanName(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/^меня\s+зовут\s+/i, '')
    .replace(/^я\s+/i, '')
    .replace(/[,;]\s*(?:мне\s*)?(?:1[6-9]|[2-9]\d)\s*(?:лет|года?)\b.*$/i, '')
    .replace(/\s+(?:мне\s*)?(?:1[6-9]|[2-9]\d)\s*(?:лет|года?)\b.*$/i, '')
    .replace(/[.;]+$/g, '')
    .trim();
  return cleaned || undefined;
}

function parseAge(value?: string): number | undefined {
  const match = value?.match(/\b(1[6-9]|[2-9]\d)\b/);
  if (!match) return undefined;
  const age = Number(match[1]);
  return age <= 100 ? age : undefined;
}

function fallbackName(text: string): string | undefined {
  return cleanName(text.match(/меня\s+зовут\s+([^\n,.!?]{1,60})/i)?.[1]);
}

function fallbackAge(text: string): number | undefined {
  const match = text.match(/мне\s+(1[6-9]|[2-9]\d)\s*(?:лет|года?)/i);
  return match ? Number(match[1]) : undefined;
}

function normalizeIdentity(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function createStableProfileId(params: {
  username?: string;
  displayName: string;
  firstMessageId?: string;
  rawProfileText: string;
}): string {
  if (params.username) return `tg_${params.username.toLowerCase()}`;
  const name = normalizeIdentity(params.displayName);
  if (params.firstMessageId) return `msg_${fnv1a(`${name}|${params.firstMessageId}`)}`;
  return `profile_${fnv1a(`${name}|${normalizeIdentity(params.rawProfileText)}`)}`;
}

function profileRichness(profile: Profile): number {
  const filled = [
    profile.name,
    profile.city,
    profile.age,
    profile.occupation,
    profile.currentChallenge,
    profile.currentPriority,
    profile.goal90Days,
    profile.canHelpWith,
    profile.telegramUsername,
  ].filter((value) => value !== undefined && value !== '').length;
  return filled + profile.rawProfileText.length / 1000;
}

function participantKey(profile: Profile): string {
  return profile.telegramUsername
    ? `tg:${profile.telegramUsername.toLowerCase()}`
    : `name:${normalizeIdentity(profile.telegramDisplayName)}`;
}

function dedupeProfiles(profiles: Profile[]): Profile[] {
  const byParticipant = new Map<string, Profile>();

  for (const profile of profiles) {
    const key = participantKey(profile);
    const current = byParticipant.get(key);
    if (!current) {
      byParticipant.set(key, profile);
      continue;
    }
    if (profileRichness(profile) > profileRichness(current)) {
      byParticipant.set(key, { ...profile, id: current.id, avatarSeed: current.id });
    }
  }

  return Array.from(byParticipant.values());
}

function buildProfile(messages: ParsedTelegramMessage[], warnings: TelegramParseWarning[]): Profile | undefined {
  const profileMessages = messages.filter((message) => !isTemplateMessage(message.text));
  const first = profileMessages[0];
  const author = first?.authorDisplayName;

  if (!first || !author) {
    warnings.push({
      code: 'profile-without-author',
      messageId: first?.id,
      detail: 'Profile-like message sequence has no resolvable author.',
    });
    return undefined;
  }

  const rawProfileText = profileMessages.map((message) => message.text).filter(Boolean).join('\n\n');
  const fields = segmentQuestionnaire(rawProfileText);
  const username = profileMessages.find((message) => message.authorUsername)?.authorUsername;
  const name = cleanName(fields.get(1)) ?? fallbackName(rawProfileText);
  const age = parseAge(fields.get(3)) ?? parseAge(fields.get(1)) ?? fallbackAge(rawProfileText);

  if (fields.size === 0 && name === undefined && age === undefined) {
    warnings.push({
      code: 'profile-without-fields',
      messageId: first.id,
      detail: `Profile for ${author} was detected, but no questionnaire fields were mapped.`,
    });
  }

  const id = createStableProfileId({ username, displayName: author, firstMessageId: first.id, rawProfileText });
  const realImageReference = profileMessages
    .flatMap((message) => message.attachments)
    .find((attachment) => attachment.kind === 'photo' && attachment.included)?.href;

  return {
    id,
    telegramDisplayName: author,
    ...(username ? { telegramUsername: username } : {}),
    ...(name ? { name } : {}),
    ...(fields.get(2) ? { city: fields.get(2) } : {}),
    ...(age !== undefined ? { age } : {}),
    ...(fields.get(4) ? { occupation: fields.get(4) } : {}),
    ...(fields.get(5) ? { currentChallenge: fields.get(5) } : {}),
    ...(fields.get(6) ? { currentPriority: fields.get(6) } : {}),
    ...(fields.get(7) ? { goal90Days: fields.get(7) } : {}),
    ...(fields.get(8) ? { canHelpWith: fields.get(8) } : {}),
    domains: [],
    challenges: [],
    searchKeywords: [],
    rawProfileText,
    sourceMessageId: first.id,
    ...(first.date ? { sourceDate: first.date } : {}),
    ...(realImageReference ? { realImageReference } : {}),
    avatarSeed: id,
  };
}

export function parseTelegramExport(html: string): TelegramParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const warnings: TelegramParseWarning[] = [];
  const messages: ParsedTelegramMessage[] = [];
  let lastAuthor: string | undefined;
  let lastAuthorUsername: string | undefined;

  for (const element of Array.from(document.querySelectorAll<HTMLElement>('.message'))) {
    if (element.classList.contains('service') || !element.classList.contains('default')) continue;

    const isJoined = element.classList.contains('joined');
    const explicitAuthor = normalizeSpace(element.querySelector('.from_name')?.textContent ?? '') || undefined;
    const explicitUsername = resolveAuthorUsername(element);

    if (explicitAuthor) {
      lastAuthor = explicitAuthor;
      lastAuthorUsername = explicitUsername;
    }

    const authorDisplayName = explicitAuthor ?? (isJoined ? lastAuthor : undefined);
    const authorUsername = explicitUsername ?? (isJoined ? lastAuthorUsername : undefined);
    const id = element.id.replace(/^message/, '');

    if (isJoined && !authorDisplayName) {
      warnings.push({
        code: 'joined-without-author',
        messageId: id,
        detail: 'Joined Telegram message appeared before a resolvable author.',
      });
    }

    const textElement = element.querySelector('.body > .text') ?? element.querySelector('.text');
    const date = element.querySelector<HTMLElement>('.pull_right.date.details')?.getAttribute('title') ?? undefined;

    messages.push({
      id,
      ...(authorDisplayName ? { authorDisplayName } : {}),
      ...(authorUsername ? { authorUsername } : {}),
      isJoined,
      ...(date ? { date } : {}),
      text: extractTextPreservingBreaks(textElement),
      links: extractLinks(textElement),
      attachments: extractAttachments(element),
    });
  }

  const groups: ParsedTelegramMessage[][] = [];
  let current: ParsedTelegramMessage[] = [];

  const flush = () => {
    if (current.length && current.some((message) => isProfileLike(message.text))) groups.push(current);
    current = [];
  };

  for (const message of messages) {
    if (!message.authorDisplayName) {
      flush();
      if (isProfileLike(message.text)) {
        warnings.push({
          code: 'profile-without-author',
          messageId: message.id,
          detail: 'Profile-like message has no author and was not imported.',
        });
      }
      continue;
    }

    if (!current.length || current[0]?.authorDisplayName === message.authorDisplayName) {
      current.push(message);
    } else {
      flush();
      current.push(message);
    }
  }
  flush();

  const profiles = dedupeProfiles(
    groups
      .map((group) => buildProfile(group, warnings))
      .filter((profile): profile is Profile => Boolean(profile)),
  );

  return { profiles, messages, warnings };
}

export const telegramParserInternals = {
  createStableProfileId,
  isProfileLike,
  segmentQuestionnaire,
  telegramUsernameFromHref,
};
