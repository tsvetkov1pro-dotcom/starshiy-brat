export const TELEGRAM_PARSER_VERSION = '2.0.0';

export { parseTelegramExport, telegramParserInternals } from './parser';
export type {
  ParsedTelegramMessage,
  TelegramAttachment,
  TelegramLink,
  TelegramParseResult,
  TelegramParseWarning,
} from './types';
