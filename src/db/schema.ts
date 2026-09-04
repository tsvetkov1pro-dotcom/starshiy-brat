import Dexie, { type EntityTable } from 'dexie';
import type { Profile } from '../types/profile';

export interface ImportMeta {
  id: 'current';
  importedAt: string;
  sourceName: string;
  profileCount: number;
}

export interface UserStateRecord {
  key: string;
  value: string;
}

class StarshiyBratDatabase extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  importMeta!: EntityTable<ImportMeta, 'id'>;
  userState!: EntityTable<UserStateRecord, 'key'>;

  constructor() {
    super('starshiy-brat');
    this.version(1).stores({
      profiles: 'id, telegramDisplayName, telegramUsername, city, *domains, *challenges',
      importMeta: 'id, importedAt',
      userState: 'key',
    });
  }
}

export const db = new StarshiyBratDatabase();
