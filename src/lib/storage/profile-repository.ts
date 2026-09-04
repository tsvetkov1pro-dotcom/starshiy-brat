import type { Profile } from '../../types/profile';
import {
  db,
  type ImportMeta,
  type MissingProfilePolicy,
  type StarshiyBratDatabase,
} from '../../db/schema';

export interface ImportProfilesInput {
  profiles: Profile[];
  sourceName: string;
  sourceSize?: number;
  sourceLastModified?: number;
  parsedMessageCount: number;
  parserVersion: string;
  classificationVersion?: string;
  importedAt?: string;
  missingProfilePolicy?: MissingProfilePolicy;
}

export interface ImportProfilesStats {
  inserted: number;
  updated: number;
  unchanged: number;
  missing: number;
  keptMissing: number;
  deletedMissing: number;
  totalStored: number;
}

function canonicalProfile(profile: Profile): string {
  return JSON.stringify({
    ...profile,
    domains: [...profile.domains].sort(),
    challenges: [...profile.challenges].sort(),
    searchKeywords: [...profile.searchKeywords].sort(),
  });
}

function assertUniqueIds(profiles: Profile[]): void {
  const ids = new Set<string>();
  for (const profile of profiles) {
    if (ids.has(profile.id)) throw new Error(`Duplicate profile id: ${profile.id}`);
    ids.add(profile.id);
  }
}

export async function importProfilesTransactionally(
  input: ImportProfilesInput,
  database: StarshiyBratDatabase = db,
): Promise<ImportProfilesStats> {
  assertUniqueIds(input.profiles);

  const importedAt = input.importedAt ?? new Date().toISOString();
  const missingProfilePolicy = input.missingProfilePolicy ?? 'keep';

  return database.transaction(
    'rw',
    database.profiles,
    database.importMeta,
    database.classificationMeta,
    async () => {
      const existingProfiles = await database.profiles.toArray();
      const existingById = new Map(existingProfiles.map((profile) => [profile.id, profile]));
      const incomingIds = new Set(input.profiles.map((profile) => profile.id));

      let inserted = 0;
      let updated = 0;
      let unchanged = 0;

      for (const profile of input.profiles) {
        const current = existingById.get(profile.id);
        if (!current) inserted += 1;
        else if (canonicalProfile(current) === canonicalProfile(profile)) unchanged += 1;
        else updated += 1;
      }

      const missingIds = existingProfiles
        .filter((profile) => !incomingIds.has(profile.id))
        .map((profile) => profile.id);

      if (input.profiles.length > 0) await database.profiles.bulkPut(input.profiles);
      if (missingProfilePolicy === 'delete' && missingIds.length > 0) {
        await database.profiles.bulkDelete(missingIds);
      }

      const totalStored = input.profiles.length + (missingProfilePolicy === 'keep' ? missingIds.length : 0);

      const importMeta: ImportMeta = {
        id: 'current',
        importedAt,
        sourceName: input.sourceName,
        sourceSize: input.sourceSize,
        sourceLastModified: input.sourceLastModified,
        parsedMessageCount: input.parsedMessageCount,
        profileCount: input.profiles.length,
        storedProfileCount: totalStored,
        parserVersion: input.parserVersion,
        missingProfilePolicy,
      };

      await database.importMeta.put(importMeta);

      if (input.classificationVersion) {
        await database.classificationMeta.put({
          id: 'current',
          status: 'ready',
          version: input.classificationVersion,
          updatedAt: importedAt,
          profileCount: totalStored,
        });
      } else if (inserted > 0 || updated > 0 || (missingProfilePolicy === 'delete' && missingIds.length > 0)) {
        await database.classificationMeta.put({
          id: 'current',
          status: 'pending',
          updatedAt: importedAt,
          profileCount: totalStored,
        });
      } else {
        const classificationMeta = await database.classificationMeta.get('current');
        if (!classificationMeta) {
          await database.classificationMeta.put({
            id: 'current',
            status: 'pending',
            updatedAt: importedAt,
            profileCount: totalStored,
          });
        }
      }

      return {
        inserted,
        updated,
        unchanged,
        missing: missingIds.length,
        keptMissing: missingProfilePolicy === 'keep' ? missingIds.length : 0,
        deletedMissing: missingProfilePolicy === 'delete' ? missingIds.length : 0,
        totalStored,
      };
    },
  );
}

export async function getProfiles(database: StarshiyBratDatabase = db): Promise<Profile[]> {
  return database.profiles.toArray();
}

export async function getImportMeta(database: StarshiyBratDatabase = db) {
  return database.importMeta.get('current');
}

export async function resetLocalDatabase(database: StarshiyBratDatabase = db): Promise<void> {
  await database.transaction(
    'rw',
    database.profiles,
    database.importMeta,
    database.classificationMeta,
    async () => {
      await Promise.all([
        database.profiles.clear(),
        database.importMeta.clear(),
        database.classificationMeta.clear(),
      ]);
    },
  );
}
