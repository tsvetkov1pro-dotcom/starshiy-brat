import Dexie, { type EntityTable } from 'dexie';
import type { Profile } from '../types/profile';

export type MissingProfilePolicy = 'keep' | 'delete';

export interface ImportMeta {
  id: 'current';
  importedAt: string;
  sourceName: string;
  sourceSize?: number;
  sourceLastModified?: number;
  parsedMessageCount: number;
  profileCount: number;
  storedProfileCount: number;
  parserVersion: string;
  missingProfilePolicy: MissingProfilePolicy;
}

export interface ClassificationMeta {
  id: 'current';
  status: 'pending' | 'ready';
  version?: string;
  updatedAt: string;
  profileCount: number;
}

export class StarshiyBratDatabase extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  importMeta!: EntityTable<ImportMeta, 'id'>;
  classificationMeta!: EntityTable<ClassificationMeta, 'id'>;

  constructor(name = 'starshiy-brat') {
    super(name);

    this.version(1).stores({
      profiles: 'id, telegramDisplayName, telegramUsername, city, *domains, *challenges',
      importMeta: 'id, importedAt',
      userState: 'key',
    });

    this.version(2).stores({
      profiles: 'id, telegramDisplayName, telegramUsername, city, *domains, *challenges',
      importMeta: 'id, importedAt, parserVersion',
      classificationMeta: 'id, status, updatedAt',
      userState: null,
    });
  }
}

export const db = new StarshiyBratDatabase();
