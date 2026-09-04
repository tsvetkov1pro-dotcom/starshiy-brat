import { useState } from 'react';
import { useAppData } from '../../app/AppDataContext';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import type { Profile } from '../../types/profile';

export function BrothersPage() {
  const { profiles, favoriteProfileIds, toggleFavorite } = useAppData();
  const [opened, setOpened] = useState<Profile>();
  const favorites = profiles.filter((profile) => favoriteProfileIds.includes(profile.id));

  return (
    <section className="directory-page">
      <header className="page-heading"><span className="eyebrow eyebrow--gold">ИЗБРАННОЕ</span><h1>Мои братья</h1><p>Люди, к которым хочется вернуться и написать.</p></header>
      {favorites.length === 0 ? <div className="panel empty-state"><h2>Пока никого не сохранил</h2><p>Нажимай на звезду в карточках участников — они появятся здесь.</p></div> : (
        <div className="directory-grid directory-grid--results">
          {favorites.map((profile) => <ProfileCard key={profile.id} profile={profile} favorite variant="result" onOpen={() => setOpened(profile)} onToggleFavorite={() => toggleFavorite(profile.id)} />)}
        </div>
      )}
      <ProfileDialog profile={opened} favorite={Boolean(opened)} onClose={() => setOpened(undefined)} onToggleFavorite={() => opened && toggleFavorite(opened.id)} />
    </section>
  );
}
