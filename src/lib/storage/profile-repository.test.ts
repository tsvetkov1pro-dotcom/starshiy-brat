import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StarshiyBratDatabase } from '../../db/schema';
import type { Profile } from '../../types/profile';
import {
  getImportMeta,
  importProfilesTransactionally,
  resetLocalDatabase,
} from './profile-repository';
import {
  getUserStateSnapshot,
  setFavoriteProfileIds,
  setSelectedSelfId,
} from './user-state';

const profile = (id: string, occupation = 'Предприниматель'): Profile => ({
  id,
  telegramDisplayName: `Участник ${id}`,
  name: `Участник ${id}`,
  city: 'Санкт-Петербург',
  occupation,
  domains: [],
  challenges: [],
  searchKeywords: [],
  rawProfileText: `1. Участник ${id}\n2. Санкт-Петербург\n4. ${occupation}`,
  avatarSeed: id,
});

const importInput = (profiles: Profile[]) => ({
  profiles,
  sourceName: 'messages.html',
  sourceSize: 12345,
  sourceLastModified: 1_725_000_000_000,
  parsedMessageCount: 42,
  parserVersion: '2.0.0',
  importedAt: '2026-09-04T12:00:00.000Z',
});

describe('profile repository', () => {
  let database: StarshiyBratDatabase;

  beforeEach(() => {
    localStorage.clear();
    database = new StarshiyBratDatabase(`starshiy-brat-test-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await database.delete();
    localStorage.clear();
  });

  it('imports profiles and writes import/classification metadata to IndexedDB', async () => {
    const stats = await importProfilesTransactionally(
      importInput([profile('a'), profile('b')]),
      database,
    );

    expect(stats).toEqual({
      inserted: 2,
      updated: 0,
      unchanged: 0,
      missing: 0,
      keptMissing: 0,
      deletedMissing: 0,
      totalStored: 2,
    });
    expect(await database.profiles.count()).toBe(2);
    expect(await getImportMeta(database)).toMatchObject({
      sourceName: 'messages.html',
      parsedMessageCount: 42,
      profileCount: 2,
      storedProfileCount: 2,
      parserVersion: '2.0.0',
    });
    expect(await database.classificationMeta.get('current')).toMatchObject({
      status: 'pending',
      profileCount: 2,
    });
  });

  it('keeps stable profiles unchanged on repeat import and preserves user state', async () => {
    const incoming = [profile('a'), profile('b')];
    await importProfilesTransactionally(importInput(incoming), database);

    setSelectedSelfId('a');
    setFavoriteProfileIds(['b']);

    const stats = await importProfilesTransactionally(
      { ...importInput(incoming), importedAt: '2026-09-04T13:00:00.000Z' },
      database,
    );

    expect(stats.inserted).toBe(0);
    expect(stats.updated).toBe(0);
    expect(stats.unchanged).toBe(2);
    expect(await database.profiles.count()).toBe(2);
    expect(getUserStateSnapshot()).toMatchObject({
      selectedSelfId: 'a',
      favoriteProfileIds: ['b'],
    });
  });

  it('updates changed stable IDs without creating duplicates', async () => {
    await importProfilesTransactionally(importInput([profile('a', 'Продажи')]), database);

    const stats = await importProfilesTransactionally(
      { ...importInput([profile('a', 'Производство')]), importedAt: '2026-09-04T13:00:00.000Z' },
      database,
    );

    expect(stats.updated).toBe(1);
    expect(await database.profiles.count()).toBe(1);
    expect((await database.profiles.get('a'))?.occupation).toBe('Производство');
  });

  it('keeps missing profiles by default and deletes them only with explicit policy', async () => {
    await importProfilesTransactionally(importInput([profile('a'), profile('b')]), database);

    const keepStats = await importProfilesTransactionally(
      { ...importInput([profile('a')]), importedAt: '2026-09-04T13:00:00.000Z' },
      database,
    );
    expect(keepStats.keptMissing).toBe(1);
    expect(await database.profiles.count()).toBe(2);

    const deleteStats = await importProfilesTransactionally(
      {
        ...importInput([profile('a')]),
        importedAt: '2026-09-04T14:00:00.000Z',
        missingProfilePolicy: 'delete',
      },
      database,
    );
    expect(deleteStats.deletedMissing).toBe(1);
    expect(await database.profiles.count()).toBe(1);
  });

  it('rolls back profile writes if metadata write fails', async () => {
    await importProfilesTransactionally(importInput([profile('a')]), database);
    vi.spyOn(database.importMeta, 'put').mockRejectedValueOnce(new Error('simulated failure'));

    await expect(
      importProfilesTransactionally(
        { ...importInput([profile('b')]), importedAt: '2026-09-04T13:00:00.000Z' },
        database,
      ),
    ).rejects.toThrow('simulated failure');

    expect((await database.profiles.toArray()).map((item) => item.id)).toEqual(['a']);
  });

  it('rejects duplicate incoming IDs before touching the database', async () => {
    await expect(
      importProfilesTransactionally(importInput([profile('a'), profile('a')]), database),
    ).rejects.toThrow('Duplicate profile id: a');
    expect(await database.profiles.count()).toBe(0);
  });

  it('resets IndexedDB data without clearing small user state', async () => {
    await importProfilesTransactionally(importInput([profile('a')]), database);
    setSelectedSelfId('a');
    setFavoriteProfileIds(['a']);

    await resetLocalDatabase(database);

    expect(await database.profiles.count()).toBe(0);
    expect(await database.importMeta.count()).toBe(0);
    expect(await database.classificationMeta.count()).toBe(0);
    expect(getUserStateSnapshot()).toMatchObject({
      selectedSelfId: 'a',
      favoriteProfileIds: ['a'],
    });
  });
});
