import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../app/AppDataContext';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import { SearchBox } from '../../components/SearchBox';
import { getRelatedSearchTerms, searchProfiles, type SearchResult } from '../../lib/search-engine';
import type { Profile } from '../../types/profile';

function allProfilesAsResults(profiles: Profile[]): SearchResult[] {
  return profiles.map((profile) => ({
    profile,
    score: 0,
    reasons: [],
    highlightTerms: [],
  }));
}

export function FindPage() {
  const { profiles, favoriteProfileIds, toggleFavorite } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [opened, setOpened] = useState<Profile>();
  const results = useMemo(
    () => initialQuery
      ? searchProfiles(profiles, initialQuery, { limit: Math.max(80, profiles.length) })
      : allProfilesAsResults(profiles),
    [profiles, initialQuery],
  );
  const relatedTerms = useMemo(() => initialQuery ? getRelatedSearchTerms(initialQuery) : [], [initialQuery]);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  function search(value: string) {
    const trimmed = value.trim();
    setSearchParams(trimmed ? { q: trimmed } : {});
  }

  const openedResult = opened ? results.find((result) => result.profile.id === opened.id) : undefined;

  return (
    <section className="directory-page find-page">
      <header className="page-heading">
        <span className="eyebrow eyebrow--gold">ПОИСК ПО ВСЕМУ ТЕКСТУ ВИЗИТОК</span>
        <h1>Найти брата</h1>
        <p>Имя знать не обязательно. Напиши задачу или сферу — поиск учитывает словоформы, связанные понятия и весь текст визиток.</p>
      </header>

      <SearchBox
        profiles={profiles}
        value={query}
        onChange={setQuery}
        onSearch={search}
        className="directory-searchbox"
        placeholder="Например: грузоперевозки, доставка, B2B продажи…"
        buttonLabel="Найти"
      />

      {profiles.length === 0 ? (
        <div className="panel empty-state search-onboarding">
          <h2>Сначала импортируй визитки сообщества</h2>
          <p>После импорта здесь появится полный каталог участников, а поиск будет работать по всей базе.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="panel empty-state"><h2>Ничего не найдено</h2><p>Попробуй более короткую формулировку или другое связанное понятие.</p></div>
      ) : (
        <>
          <div className="results-heading results-heading--search">
            <div>
              <strong>{initialQuery ? `Найдено: ${results.length}` : `Все участники: ${results.length}`}</strong>
              {initialQuery && <span>по запросу «{initialQuery}»</span>}
            </div>
            {initialQuery && relatedTerms.length > 1 && <p>Также учитываем: {relatedTerms.filter((term) => term.toLowerCase() !== initialQuery.toLowerCase()).slice(0, 5).join(' · ')}</p>}
          </div>
          <div className="directory-grid directory-grid--results">
            {results.map((result) => {
              const firstReason = result.reasons[0];
              const reason = firstReason?.field === 'exact' ? undefined : firstReason?.label;
              return (
                <ProfileCard
                  key={result.profile.id}
                  profile={result.profile}
                  favorite={favoriteProfileIds.includes(result.profile.id)}
                  reason={reason}
                  excerpt={result.excerpt}
                  highlightTerms={initialQuery ? [initialQuery, ...result.highlightTerms] : []}
                  variant="result"
                  onOpen={() => setOpened(result.profile)}
                  onToggleFavorite={() => toggleFavorite(result.profile.id)}
                />
              );
            })}
          </div>
        </>
      )}

      <ProfileDialog
        profile={opened}
        favorite={opened ? favoriteProfileIds.includes(opened.id) : false}
        highlightTerms={openedResult && initialQuery ? [initialQuery, ...openedResult.highlightTerms] : initialQuery ? [initialQuery] : []}
        contextLabel={initialQuery ? `Найдено по запросу: ${initialQuery}` : undefined}
        onClose={() => setOpened(undefined)}
        onToggleFavorite={() => opened && toggleFavorite(opened.id)}
      />
    </section>
  );
}
