import { ArrowRight, RefreshCw, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import { useAppData } from '../../app/AppDataContext';
import { countTags } from '../../lib/classification';
import { recommendProfiles } from '../../lib/recommendation-engine';
import type { Profile } from '../../types/profile';

const tierLabels = { high: 'Высокое совпадение', relevant: 'Подходит тебе', similar: 'Есть пересечения' } as const;

export function HomePage() {
  const navigate = useNavigate();
  const {
    profiles,
    ready,
    selectedSelfId,
    selectedInterests,
    selectedChallenges,
    favoriteProfileIds,
    selectSelf,
    toggleFavorite,
    toggleInterest,
    toggleChallenge,
  } = useAppData();
  const [query, setQuery] = useState('');
  const [openedProfile, setOpenedProfile] = useState<Profile | undefined>();

  const selectedSelf = profiles.find((profile) => profile.id === selectedSelfId);
  const favorites = profiles.filter((profile) => favoriteProfileIds.includes(profile.id)).slice(0, 6);
  const domainCounts = [...countTags(profiles, 'domains').entries()];
  const challengeCounts = [...countTags(profiles, 'challenges').entries()];
  const topDomains = domainCounts.filter(([name]) => name !== 'Другое').slice(0, 7);
  const topChallenges = challengeCounts.slice(0, 4);

  const recommendations = useMemo(() => {
    if (!selectedSelf) return [];
    return recommendProfiles({
      selectedSelf,
      candidates: profiles,
      selectedInterests,
      selectedChallenges,
      limit: 4,
    });
  }, [selectedSelf, profiles, selectedInterests, selectedChallenges]);

  const recommendationProfiles = recommendations
    .map((recommendation) => ({ recommendation, profile: profiles.find((profile) => profile.id === recommendation.profileId) }))
    .filter((item): item is { recommendation: (typeof recommendations)[number]; profile: Profile } => Boolean(item.profile));

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/find?q=${encodeURIComponent(value)}` : '/find');
  }

  return (
    <div className="home-page">
      <section className="hero hero--community" aria-labelledby="hero-title">
        <div className="hero__city" aria-hidden="true">
          <span className="hero__building hero__building--one" />
          <span className="hero__building hero__building--two" />
          <span className="hero__sun" />
          <span className="hero__figures" />
        </div>
        <div className="hero__content">
          <span className="eyebrow">СТАРШИЙ БРАТ · НАВИГАТОР ПО СООБЩЕСТВУ</span>
          <h1 id="hero-title">Найди того,<br />кто уже проходил через это</h1>
          <p>Опыт братьев рядом. Поддержка без лишних слов.</p>
        </div>
      </section>

      <form className="search-bridge" aria-label="Поиск по сообществу" onSubmit={submitSearch}>
        <Search size={20} aria-hidden="true" />
        <input aria-label="Поиск" placeholder="Кого ищешь? Например: IT, продажи, стройка…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="button button--primary" type="submit">Найти брата</button>
      </form>

      {!ready ? <div className="panel loading-panel">Загружаю локальную базу…</div> : profiles.length === 0 ? (
        <section className="panel empty-state empty-state--home">
          <div><span className="eyebrow eyebrow--gold">ПЕРВЫЙ ЗАПУСК</span><h2>Загрузите визитки сообщества</h2><p>Файл Telegram обрабатывается локально на вашем устройстве и не отправляется на сервер.</p></div>
          <Link className="button button--primary" to="/import">Импортировать messages.html <ArrowRight size={16} /></Link>
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <article className="panel panel--self">
              <div className="panel__heading"><h2>Выберите себя</h2></div>
              <label className="self-select">
                <span className="sr-only">Выберите свою визитку</span>
                <select value={selectedSelfId ?? ''} onChange={(event) => selectSelf(event.target.value || undefined)}>
                  <option value="">Найти себя в базе…</option>
                  {profiles.slice().sort((a, b) => (a.name ?? a.telegramDisplayName).localeCompare(b.name ?? b.telegramDisplayName, 'ru')).map((profile) => <option value={profile.id} key={profile.id}>{profile.name ?? profile.telegramDisplayName}{profile.city ? ` · ${profile.city}` : ''}</option>)}
                </select>
              </label>

              {selectedSelf ? (
                <div className="self-summary">
                  <div className="self-summary__person"><ProfileAvatar profile={selectedSelf} /><div><strong>{selectedSelf.name ?? selectedSelf.telegramDisplayName}</strong><span>{[selectedSelf.occupation, selectedSelf.city].filter(Boolean).join(' · ')}</span></div></div>
                  <div className="chip-group"><span className="chip-group__label">Мои интересы</span><div className="chip-row">{topDomains.slice(0, 5).map(([domain]) => <button type="button" className={`chip${selectedInterests.includes(domain) ? ' is-active' : ''}`} onClick={() => toggleInterest(domain)} key={domain}>{domain}</button>)}</div></div>
                  <div className="chip-group"><span className="chip-group__label">Мои вызовы</span><div className="chip-row">{challengeCounts.slice(0, 5).map(([challenge]) => <button type="button" className={`chip${selectedChallenges.includes(challenge) ? ' is-active' : ''}`} onClick={() => toggleChallenge(challenge)} key={challenge}>{challenge}</button>)}</div></div>
                </div>
              ) : <p className="muted">Выбери свою визитку — рекомендации станут персональными.</p>}
            </article>

            <article className="panel panel--recommendations">
              <div className="panel__heading"><h2>{selectedSelf ? `Подобрано для ${selectedSelf.name?.split(' ')[0] ?? 'тебя'}` : 'Подобрано для тебя'}</h2><RefreshCw size={16} aria-hidden="true" /></div>
              <div className="recommendation-grid">
                {recommendationProfiles.length > 0 ? recommendationProfiles.map(({ profile, recommendation }) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    favorite={favoriteProfileIds.includes(profile.id)}
                    reason={`${tierLabels[recommendation.tier]} · ${recommendation.reasons[0]?.label ?? ''}`}
                    onOpen={() => setOpenedProfile(profile)}
                    onToggleFavorite={() => toggleFavorite(profile.id)}
                  />
                )) : [0, 1, 2, 3].map((index) => <div className="recommendation-empty" key={index}><div className="avatar-placeholder" /><span>{selectedSelf ? 'Добавь интересы или вызовы' : 'Сначала выбери себя'}</span></div>)}
              </div>
            </article>
          </section>

          <section className="panel favorites-strip">
            <div className="section-heading"><h2>Мои братья <span>{favoriteProfileIds.length}</span></h2><Link to="/brothers">Смотреть всех <ArrowRight size={15} /></Link></div>
            {favorites.length > 0 ? <div className="favorite-row">{favorites.map((profile) => <button className="favorite-person" type="button" key={profile.id} onClick={() => setOpenedProfile(profile)}><ProfileAvatar profile={profile} size="sm" /><span><strong>{profile.name ?? profile.telegramDisplayName}</strong><small>{profile.domains[0] ?? profile.occupation ?? 'Участник'}</small></span></button>)}</div> : <p className="muted">Нажми на звезду в карточке — сохранённые братья появятся здесь.</p>}
          </section>

          <section className="insight-grid">
            <article className="panel domains-panel">
              <div className="section-heading"><h2>Сферы сообщества</h2><Link to="/domains">Смотреть все <ArrowRight size={15} /></Link></div>
              <div className="domain-mosaic">
                {topDomains.map(([domain, count], index) => <button type="button" className={`domain-tile domain-tile--${Math.min(index + 1, 7)}`} key={domain} onClick={() => navigate(`/domains?domain=${encodeURIComponent(domain)}`)}><strong>{domain}</strong><span>{count}</span><i aria-hidden="true" /></button>)}
                {domainCounts.find(([name]) => name === 'Другое') && <button type="button" className="domain-tile domain-tile--other" onClick={() => navigate('/domains?domain=Другое')}><strong>Другое</strong><span>{domainCounts.find(([name]) => name === 'Другое')?.[1]}</span></button>}
              </div>
            </article>

            <article className="panel challenges-panel">
              <div className="section-heading"><h2>Кто проходит через похожие вызовы</h2><Link to="/challenges">Смотреть все <ArrowRight size={15} /></Link></div>
              <div className="challenge-list">{topChallenges.map(([challenge, count]) => {
                const preview = profiles.filter((profile) => profile.challenges.includes(challenge)).slice(0, 4);
                return <button className="challenge-row" type="button" key={challenge} onClick={() => navigate(`/challenges?challenge=${encodeURIComponent(challenge)}`)}><span className="challenge-row__icon"><Users size={17} /></span><span className="challenge-row__text"><strong>{challenge}</strong><small>{count} {count === 1 ? 'брат' : 'братьев'}</small></span><span className="avatar-stack">{preview.map((profile) => <ProfileAvatar profile={profile} size="sm" key={profile.id} />)}</span><ArrowRight size={16} /></button>;
              })}</div>
            </article>
          </section>
        </>
      )}

      <ProfileDialog profile={openedProfile} favorite={openedProfile ? favoriteProfileIds.includes(openedProfile.id) : false} onClose={() => setOpenedProfile(undefined)} onToggleFavorite={() => openedProfile && toggleFavorite(openedProfile.id)} />
    </div>
  );
}
