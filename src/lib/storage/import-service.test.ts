import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StarshiyBratDatabase } from '../../db/schema';
import type { Profile } from '../../types/profile';
import { importProfilesTransactionally } from './profile-repository';
import { importTelegramHtml } from './import-service';

const existingProfile: Profile = {
  id: 'existing',
  telegramDisplayName: 'Существующий участник',
  name: 'Существующий участник',
  domains: [],
  challenges: [],
  searchKeywords: [],
  rawProfileText: 'Существующая визитка',
  avatarSeed: 'existing',
};

const profileHtml = `<!doctype html><html><body>
  <div class="message default clearfix" id="message100">
    <div class="body">
      <div class="pull_right date details" title="04.09.2026 12:00:00 UTC+03:00"></div>
      <div class="from_name">Иван Петров</div>
      <div class="text">1. Иван Петров<br>2. Санкт-Петербург<br>3. 34 года<br>4. Производство<br>5. Поиск клиентов<br>6. Семья<br>7. Вырастить бизнес<br>8. Могу помочь с производством</div>
    </div>
  </div>
</body></html>`;

describe('Telegram import service', () => {
  let database: StarshiyBratDatabase;

  beforeEach(() => {
    database = new StarshiyBratDatabase(`starshiy-brat-import-test-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('parses and stores a valid Telegram export', async () => {
    const result = await importTelegramHtml(
      profileHtml,
      {
        sourceName: 'messages.html',
        sourceSize: profileHtml.length,
        importedAt: '2026-09-04T12:00:00.000Z',
      },
      database,
    );

    expect(result.parsed.profiles).toHaveLength(1);
    expect(result.stats.inserted).toBe(1);
    expect(await database.profiles.count()).toBe(1);
    expect(await database.importMeta.get('current')).toMatchObject({
      sourceName: 'messages.html',
      parserVersion: '2.0.0',
      parsedMessageCount: 1,
      profileCount: 1,
    });
  });

  it('does not mutate the current database when the file has no Telegram messages', async () => {
    await importProfilesTransactionally(
      {
        profiles: [existingProfile],
        sourceName: 'previous.html',
        parsedMessageCount: 1,
        parserVersion: '2.0.0',
        importedAt: '2026-09-04T11:00:00.000Z',
      },
      database,
    );

    await expect(
      importTelegramHtml('<html><body>not telegram</body></html>', { sourceName: 'bad.html' }, database),
    ).rejects.toMatchObject({ code: 'no-telegram-messages' });

    expect((await database.profiles.toArray()).map((profile) => profile.id)).toEqual(['existing']);
    expect((await database.importMeta.get('current'))?.sourceName).toBe('previous.html');
  });

  it('does not replace the database when Telegram messages exist but contain no profiles', async () => {
    await importProfilesTransactionally(
      {
        profiles: [existingProfile],
        sourceName: 'previous.html',
        parsedMessageCount: 1,
        parserVersion: '2.0.0',
      },
      database,
    );

    const chatOnly = `<!doctype html><html><body>
      <div class="message default clearfix" id="message200">
        <div class="body"><div class="from_name">Иван</div><div class="text">Всем привет!</div></div>
      </div>
    </body></html>`;

    await expect(
      importTelegramHtml(chatOnly, { sourceName: 'chat.html' }, database),
    ).rejects.toMatchObject({ code: 'no-profiles' });

    expect((await database.profiles.toArray()).map((profile) => profile.id)).toEqual(['existing']);
  });
});
