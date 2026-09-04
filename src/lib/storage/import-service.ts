import { db, type MissingProfilePolicy, type StarshiyBratDatabase } from '../../db/schema';
import type { Profile } from '../../types/profile';
import { CLASSIFICATION_VERSION, classifyProfiles } from '../classification';
import {
  TELEGRAM_PARSER_VERSION,
  parseTelegramExport,
  type TelegramParseResult,
} from '../telegram-parser';
import {
  importProfilesTransactionally,
  type ImportProfilesStats,
} from './profile-repository';

export type ImportValidationCode = 'no-telegram-messages' | 'no-profiles';

export class ImportValidationError extends Error {
  constructor(
    public readonly code: ImportValidationCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

export interface ImportTelegramOptions {
  sourceName: string;
  sourceSize?: number;
  sourceLastModified?: number;
  missingProfilePolicy?: MissingProfilePolicy;
  importedAt?: string;
}

export interface ImportTelegramResult {
  parsed: TelegramParseResult;
  profiles: Profile[];
  stats: ImportProfilesStats;
}

export async function importTelegramHtml(
  html: string,
  options: ImportTelegramOptions,
  database: StarshiyBratDatabase = db,
): Promise<ImportTelegramResult> {
  const parsed = parseTelegramExport(html);

  if (parsed.messages.length === 0) {
    throw new ImportValidationError(
      'no-telegram-messages',
      'В файле не найдены сообщения Telegram. Текущая локальная база не изменена.',
    );
  }

  if (parsed.profiles.length === 0) {
    throw new ImportValidationError(
      'no-profiles',
      'В выгрузке не найдены визитки участников. Текущая локальная база не изменена.',
    );
  }

  const profiles = classifyProfiles(parsed.profiles);
  const stats = await importProfilesTransactionally(
    {
      profiles,
      sourceName: options.sourceName,
      sourceSize: options.sourceSize,
      sourceLastModified: options.sourceLastModified,
      parsedMessageCount: parsed.messages.length,
      parserVersion: TELEGRAM_PARSER_VERSION,
      classificationVersion: CLASSIFICATION_VERSION,
      importedAt: options.importedAt,
      missingProfilePolicy: options.missingProfilePolicy,
    },
    database,
  );

  return { parsed, profiles, stats };
}

export async function importTelegramFile(
  file: File,
  options: Omit<ImportTelegramOptions, 'sourceName' | 'sourceSize' | 'sourceLastModified'> = {},
  database: StarshiyBratDatabase = db,
): Promise<ImportTelegramResult> {
  return importTelegramHtml(
    await file.text(),
    {
      ...options,
      sourceName: file.name,
      sourceSize: file.size,
      sourceLastModified: file.lastModified,
    },
    database,
  );
}
