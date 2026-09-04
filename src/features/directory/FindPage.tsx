import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../app/AppDataContext';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import { searchProfiles } from '../../lib/search-engine';
import type { Profile } from '../../types/profile';

export function FindPage() {
  const { profiles, favoriteProfileIds, toggleFavorite } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [opened, setOpened] = useState<Profile>();
  const results = useMemo(() => initialQuery ? searchProfiles(profiles, initialQuery, { limit: 50 }) : [], [profiles, initialQuery]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    setSearchParams(value ? { q: value } : {});
  }

  return (
    <section className="directory-page">
      <header className="page-heading"><span className="eyebrow eyebrow--gold">ПОИСК ПО СООБЩЕСТВУ</span><h1>Найти брата</h1><p>Ищи по имени, городу, профессии, компетенции, задаче или похожей ситуации.</p></header>
      <form className="directory-search" onSubmit={submit}><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: кто поможет с B2B продажами?" aria-label="Поиск по визиткам" /><button className="button button--primary" type="submit">Найти</button></form>
      {!initialQuery ? <div className="panel empty-state"><h2>Сформулируй задачу обычными словами</h2><p>Например: «кто из Питера работает с ИИ» или «кто может помочь с продажами».</p></div> : results.length === 0 ? <div className="panel empty-state"><h2>Ничего не найдено</h2><p>Попробуй сократить запрос или использовать название сферы/вызова.</p></div> : <><div className="results-heading"><strong>Найдено: {results.length}</strong><span>«{initialQuery}»</span></div><div className="directory-grid">{results.map(({ profile, reasons }) => <ProfileCard key={profile.id} profile={profile} favorite={favoriteProfileIds.includes(profile.id)} reason={reasons[0]?.label} onOpen={() => setOpened(profile)} onToggleFavorite={() => toggleFavorite(profile.id)} />)}</div></>}
      <ProfileDialog profile={opened} favorite={opened ? favoriteProfileIds.includes(opened.id) : false} onClose={() => setOpened(undefined)} onToggleFavorite={() => opened && toggleFavorite(opened.id)} />
    </section>
  );
}
