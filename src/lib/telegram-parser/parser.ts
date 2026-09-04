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
    result = result.split(emoji).join(digit);
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

    const isBlock = blockTags.has(element.tagName);
    if (isBlock && chunks.length > 0 && !chunks[chunks.length - 1]?.endsWith('\n')) {
      chunks.push('\n');
    }

    for (const child of Array.from(element.childNodes)) walk(child);

    if (isBlock && !chunks[chunks.length - 1]?.endsWith('\n')) chunks.push('\n');
  };

  for (const child of Array.from(root.childNodes)) walk(child);

  return chunks
    .join('')
    .split('\n')
    .map((line) => normalizeSpace(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function telegramUsernameFromHref(href: string): string | undefined {
  try {
    const url = new URL(href);
    if (!TELEGRAM_HOSTS.has(url.hostname.toLowerCase())) return undefined;
    const segment = url.pathname.split('/').filter(Boolean)[0];
    if (!segment || !/^[A-Za-z0-9_]{5,32}$/.test(segment)) return undefined;
    return segment;
  } catch {
    return undefined;
  }
}

function extractLinks(textElement: Element | null): TelegramLink[] {
  if (!textElement) return [];
  return Array.from(textElement.querySelectorAll('a[href]'))
    .map((anchor) => {
      const href = anchor.getAttribute('href')?.trim() ?? '';
      if (!href) return undefined;
      return {
        href,
        text: normalizeSpace(anchor.textContent ?? ''),
        username: telegramUsernameFromHref(href),
      } satisfies TelegramLink;
    })
    .filter((link): link is TelegramLink => Boolean(link));
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

  return /(мой\s+(?:тг|телеграм|telegram)|для\s+связи|связаться\s+со\s+мной|пишите\s+мне|написать\s+мне|мой\s+аккаунт)/i.test(
    nearby,
  );
}

function resolveAuthorUsername(messageElement: Element): string | undefined {
  const fromAnchor = messageElement.querySelector<HTMLAnchorElement>('.from_name a[href]');
  if (fromAnchor) {
    const username = telegramUsernameFromHref(fromAnchor.href);
    if (username) return username;
  }

  const anchors = Array.from(
    messageElement.querySelectorAll<HTMLAnchorElement>('.text a[href]'),
  );

  for (const anchor of anchors) {
    const username = telegramUsernameFromHref(anchor.href);
    if (username && hasSelfContactContext(anchor)) return username;
  }

  return undefined;
}

function extractAttachments(messageElement: Element): TelegramAttachment[] {
  const attachments: TelegramAttachment[] = [];

  for (const photo of Array.from(
    messageElement.querySelectorAll<HTMLAnchorElement>('a.photo_wrap[href]'),
  )) {
    attachments.push({
      kind: 'photo',
      href: photo.getAttribute('href') ?? undefined,
      previewSrc: photo.querySelector<HTMLImageElement>('img.photo')?.getAttribute('src') ?? undefined,
      included: true,
    });
  }

  for (const placeholder of Array.from(
    messageElement.querySelectorAll<HTMLElement>('.media_photo'),
  )) {
    attachments.push({
      kind: 'photo',
      title: normalizeSpace(placeholder.querySelector('.title')?.textContent ?? '') || undefined,
      description:
        normalizeSpace(placeholder.querySelector('.description')?.textContent ?? '') || undefined,
      status: normalizeSpace(placeholder.querySelector('.status')?.textContent ?? '') || undefined,
      included: false,
    });
  }

  for (const file of Array.from(
    messageElement.querySelectorAll<HTMLAnchorElement>('a.file_wrap[href]'),
  )) {
    attachments.push({
      kind: 'file',
      href: file.getAttribute('href') ?? undefined,
      title: normalizeSpace(file.querySelector('.title')?.textContent ?? '') || undefined,
      status: normalizeSpace(file.querySelector('.status')?.textContent ?? '') || undefined,
      included: true,
    });
  }

  return attachments;
}

function isTemplateMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('для знакомства предлагаю') && lower.includes('как тебя зовут');
}

function questionnaireMarkerCount(text: string): number {
  const normalized = normalizeEmojiDigits(text);
  return normalized
    .split('\n')
    .filter((line) => /^\s*[1-8](?:\s*[-–—/]\s*[1-8])?\s*[.)]?\s*\S/.test(line)).length;
}

function isProfileLike(text: string): boolean {
  if (!text || isTemplateMessage(text)) return false;
  if (questionnaireMarkerCount(text) >= 3) return true;

  const lower = text.toLowerCase();
  const hasIntroTag = lower.includes('#знакомство') || lower.includes('#знакомоство');
  if (hasIntroTag && text.length >= 100) return true;

  return /меня\s+зовут/i.test(text) && /\b\d{2}\s*(?:лет|года?)\b/i.test(text);
}

function segmentQuestionnaire(text: string): Map<number, string> {
  const normalized = normalizeEmojiDigits(text);
  const values = new Map<number, string[]>();
  let currentKeys: number[] = [];

  for (const rawLine of normalized.split('\n')) {
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

    if (currentKeys.length > 0) {
      currentKeys.forEach((key) => values.get(key)?.push(line));
    }
  }

  return new Map(
    Array.from(values.entries()).map(([key, parts]) => [key, normalizeSpace(parts.join(' '))]),
  );
}

function cleanName(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/^меня\s+зовут\s+/i, '')
    .replace(/^я\s+/i, '')
    .replace(/[.;]+$/g, '')
    .trim();
  return cleaned || undefined;
}

function parseAge(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\b(1[6-9]|[2-9]\d)\b/);
  if (!match) return undefined;
  const age = Number(match[1]);
  return age <= 100 ? age : undefined;
}

function fallbackName(text: string): string | undefined {
  const match = text.match(/меня\s+зовут\s+([^\n,.!?]{1,60})/i);
  return cleanName(match?.[1]);
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

  const normalizedName = normalizeIdentity(params.displayName);
  if (params.firstMessageId) {
    return `msg_${fnv1a(`${normalizedName}|${params.firstMessageId}`)}`;
  }

  return `profile_${fnv1a(`${normalizedName}|${normalizeIdentity(params.rawProfileText)}`)}`;
}

function profileRichness(profile: Profile): number {
  return [
    profile.name,
    profile.city,
    profile.age,
    profile.occupation,
    profile.currentChallenge,
    profile.currentPriority,
    profile.goal90Days,
    profile.canHelpWith,
    profile.telegramUsername,
  ].filter((value) => value !== undefined && value !== '').length + profile.rawProfileText.length / 1000;
}

function dedupeProfiles(profiles: Profile[]): Profile[] {
  const byId = new Map<string, Profile>();
  for (const profile of profiles) {
    const current = byId.get(profile.id);
    if (!current || profileRichness(profile) > profileRichness(current)) {
      byId.set(profile.id, profile);
    }
  }
  return Array.from(byId.values());
}

function buildProfile(
  messages: ParsedTelegramMessage[],
  warnings: TelegramParseWarning[],
): Profile | undefined {
  const first = messages[0];
  const author = first?.authorDisplayName;
  if (!first || !author) {
    warnings.push({
      code: 'profile-without-author',
      messageId: first?.id,
      detail: 'Profile-like message sequence has no resolvable author.',
    });
    return undefined;
  }

  const rawProfileText = messages.map((message) => message.text).filter(Boolean).join('\n\n');
  const fields = segmentQuestionnaire(rawProfileText);
  const username = messages.find((message) => message.authorUsername)?.authorUsername;

  const name = cleanName(fields.get(1)) ?? fallbackName(rawProfileText);
  const age = parseAge(fields.get(3)) ?? fallbackAge(rawProfileText);

  const hasStructuredFields = fields.size > 0 || name !== undefined || age !== undefined;
  if (!hasStructuredFields) {
    warnings.push({
      code: 'profile-without-fields',
      messageId: first.id,
      detail: `Profile for ${author} was detected, but no questionnaire fields were mapped.`,
    });
  }

  const id = createStableProfileId({
    username,
    displayName: author,
    firstMessageId: first.id,
    rawProfileText,
  });

  return {
    id,
    telegramDisplayName: author,
    telegramUsername: username,
    name,
    city: fields.get(2),
    age,
    occupation: fields.get(4),
    currentChallenge: fields.get(5),
    currentPriority: fields.get(6),
    goal90Days: fields.get(7),
    canHelpWith: fields.get(8),
    domains: [],
    challenges: [],
    searchKeywords: [],
    rawProfileText,
    sourceMessageId: first.id,
    sourceDate: first.date,
    realImageReference: messages
      .flatMap((message) => message.attachments)
      .find((attachment) => attachment.kind === 'photo' && attachment.included)?.href,
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
    if (element.classList.contains('service')) continue;
    if (!element.classList.contains('default')) continue;

    const isJoined = element.classList.contains('joined');
    const explicitAuthor = normalizeSpace(element.querySelector('.from_name')?.textContent ?? '') || undefined;
    const explicitUsername = resolveAuthorUsername(element);

    if (explicitAuthor) {
      lastAuthor = explicitAuthor;
      lastAuthorUsername = explicitUsername;
    }

    const authorDisplayName = explicitAuthor ?? (isJoined ? lastAuthor : undefined);
    const authorUsername = explicitUsername ?? (isJoined ? lastAuthorUsername : undefined);

    if (isJoined && !authorDisplayName) {
      warnings.push({
        code: 'joined-without-author',
        messageId: element.id.replace(/^message/, ''),
        detail: 'Joined Telegram message appeared before a resolvable author.',
      });
    }

    const textElement = element.querySelector('.body > .text') ?? element.querySelector('.text');
    const dateElement = element.querySelector<HTMLElement>('.pull_right.date.details');

    messages.push({
      id: element.id.replace(/^message/, ''),
      authorDisplayName,
      authorUsername,
      isJoined,
      date: dateElement?.getAttribute('title') ?? undefined,
      text: extractTextPreservingBreaks(textElement),
      links: extractLinks(textElement),
      attachments: extractAttachments(element),
    });
  }

  const profileGroups: ParsedTelegramMessage[][] = [];
  let currentGroup: ParsedTelegramMessage[] = [];

  const flush = () => {
    if (currentGroup.length > 0 && currentGroup.some((message) => isProfileLike(message.text))) {
      profileGroups.push(currentGroup);
    }
    currentGroup = [];
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

    if (
      currentGroup.length === 0 ||
      currentGroup[0]?.authorDisplayName === message.authorDisplayName
    ) {
      currentGroup.push(message);
    } else {
      flush();
      currentGroup.push(message);
    }
  }
  flush();

  const profiles = dedupeProfiles(
    profileGroups
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
