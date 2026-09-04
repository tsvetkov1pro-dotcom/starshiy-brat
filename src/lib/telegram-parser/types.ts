import type { Profile } from '../../types/profile';

export interface TelegramAttachment {
  kind: 'photo' | 'file' | 'unknown';
  href?: string;
  previewSrc?: string;
  title?: string;
  description?: string;
  status?: string;
  included: boolean;
}

export interface TelegramLink {
  href: string;
  text: string;
  username?: string;
}

export interface ParsedTelegramMessage {
  id: string;
  authorDisplayName?: string;
  authorUsername?: string;
  isJoined: boolean;
  date?: string;
  text: string;
  links: TelegramLink[];
  attachments: TelegramAttachment[];
}

export interface TelegramParseWarning {
  code:
    | 'joined-without-author'
    | 'profile-without-author'
    | 'profile-without-fields';
  messageId?: string;
  detail: string;
}

export interface TelegramParseResult {
  profiles: Profile[];
  messages: ParsedTelegramMessage[];
  warnings: TelegramParseWarning[];
}
