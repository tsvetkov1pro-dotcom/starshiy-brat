import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../app/AppDataContext';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import { countTags } from '../../lib/classification';
import type { Profile } from '../../types/profile';

export function TagDirectoryPage({ mode }: { mode: 'domains' | 'challenges' }) {
  const { profiles, favoriteProfileIds, toggleFavorite } = useAppData();
  const [params, setParams] = useSearchParams();
  const [opened, setOpened] = useState<Profile>();
  const paramName = mode === 'domains' ? 'domain' : 'challenge';
  const active = params.get(paramName) ?? '';
  const counts = [...countTags(profiles, mode).entries()];
  const filtered = useMemo(() => active ? profiles.filter((profile) => profile[mode].includes(active)) : profiles, [active, profiles, mode]);
  const title = mode === 'domains' ? 'Сферы сообщества' : 'Похожие вызовы';
  const description = mode === 'domains' ? 'Состав сообщества по реальным компетенциям из визиток.' : 'Люди, которые сейчас проходят через похожие задачи и ситуации.';

  return (
    <section className="directory-page">
      <header className="page-heading"><span className="eyebrow eyebrow--gold">{mode === 'domains' ? 'КАРТА КОМПЕТЕНЦИЙ' : 'ОБЩИЙ ОПЫТ'}</span><h1>{title}</h1><p>{description}</p></header>
      <div className="filter-chips"><button type="button" className={`chip${!active ? ' is-active' : ''}`} onClick={() => setParams({})}>Все · {profiles.length}</button>{counts.map(([tag, count]) => <button type="button" className={`chip${active === tag ? ' is-active' : ''}`} key={tag} onClick={() => setParams({ [paramName]: tag })}>{tag} · {count}</button>)}</div>
      {filtered.length === 0 ? <div className="panel empty-state"><h2>В этой категории пока никого нет</h2></div> : <div className="directory-grid">{filtered.slice(0, 100).map((profile) => <ProfileCard key={profile.id} profile={profile} favorite={favoriteProfileIds.includes(profile.id)} reason={active || profile[mode][0]} onOpen={() => setOpened(profile)} onToggleFavorite={() => toggleFavorite(profile.id)} />)}</div>}
      <ProfileDialog profile={opened} favorite={opened ? favoriteProfileIds.includes(opened.id) : false} onClose={() => setOpened(undefined)} onToggleFavorite={() => opened && toggleFavorite(opened.id)} />
    </section>
  );
}
