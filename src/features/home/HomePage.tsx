import { ArrowRight, RefreshCw, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../../app/AppDataContext';
import { DomainArtwork } from '../../components/DomainArtwork';
import { HeroBanner } from '../../components/HeroBanner';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileDialog } from '../../components/ProfileDialog';
import { SearchBox } from '../../components/SearchBox';
import { countTags } from '../../lib/classification';
import { getProfileDisplayName } from '../../lib/profile-normalization';
import { recommendProfiles } from '../../lib/recommendation-engine';
import type { Profile } from '../../types/profile';

const tierLabels = {
  high: 'Высокое совпадение',
  relevant: 'Подходит по интересам',
  similar: 'Похожий вызов',
} as const;

const HOME_DOMAINS = ['IT / AI', 'Строительство', 'Финансы', 'Продажи', 'Маркетинг', 'Производство'] as const;

function pluralBrothers(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'брат';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'брата';
  return 'братьев';
}

function rotate<T>(items: T[], shift: number): T[] {
  if (items.length < 2) return items;
  const normalized = shift % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

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
  const [openedProfile, setOpenedProfile] = useState<Profile>();
  const [refreshSeed, setRefreshSeed] = useState(0);

  const selectedSelf = profiles.find((profile) => profile.id === selectedSelfId);
  const favorites = profiles.filter((profile) => favoriteProfileIds.includes(profile.id)).slice(0, 6);
  const domainCounts = countTags(profiles, 'domains');
  const challengeCounts = [...countTags(profiles, 'challenges').entries()].slice(0, 3);

  const recommendationPool = useMemo(() => {
    if (!selectedSelf) return [];
    return recommendProfiles({
      selectedSelf,
      candidates: profiles,
      selectedInterests,
      selectedChallenges,
      limit: 24,
    });
  }, [selectedSelf, profiles, selectedInterests, selectedChallenges]);

  const recommendationProfiles = useMemo(() => {
    const hydrated = recommendationPool
      .map((recommendation) => ({ recommendation, profile: profiles.find((profile) => profile.id === recommendation.profileId) }))
      .filter((item): item is { recommendation: (typeof recommendationPool)[number]; profile: Profile } => Boolean(item.profile));
    return rotate(hydrated, refreshSeed).slice(0, 4);
  }, [recommendationPool, profiles, refreshSeed]);

  const selfDomains = [...domainCounts.keys()].filter((name) => name !== 'Другое').slice(0, 4);
  const selfChallenges = [...countTags(profiles, 'challenges').keys()].slice(0, 4);

  function search(value: string) {
    const trimmed = value.trim();
    navigate(trimmed ? `/find?q=${encodeURIComponent(trimmed)}` : '/find');
  }

  return (
    <div className="home-page home-page--v1">
      <HeroBanner />

      <SearchBox
        profiles={profiles}
        value={query}
        onChange={setQuery}
        onSearch={search}
        className="search-bridge"
        placeholder="Кого ищешь? Например: грузоперевозки, продажи, AI…"
        buttonLabel="Найти брата"
      />

      <div className="home-stack">
        <section className="dashboard-grid">
          <article className="panel panel--self">
            <div className="panel__heading"><h2>Выберите себя</h2></div>
            {!ready ? <p className="muted">Загружаю локальную базу…</p> : profiles.length === 0 ? (
              <div className="self-empty">
                <p>Сначала импортируй визитки сообщества. Файл обрабатывается только на этом устройстве.</p>
                <Link className="button button--secondary" to="/import">Импортировать чат</Link>
              </div>
            ) : (
              <>
                <label className="self-select">
                  <span className="sr-only">Выберите свою визитку</span>
                  <select value={selectedSelfId ?? ''} onChange={(event) => { selectSelf(event.target.value || undefined); setRefreshSeed(0); }}>
                    <option value="">Найти себя в базе…</option>
                    {profiles.slice().sort((a, b) => getProfileDisplayName(a).localeCompare(getProfileDisplayName(b), 'ru')).map((profile) => (
                      <option value={profile.id} key={profile.id}>{getProfileDisplayName(profile)}{profile.city ? ` · ${profile.city}` : ''}</option>
                    ))}
                  </select>
                </label>
                {selectedSelf ? (
                  <div className="self-summary">
                    <div className="self-summary__person">
                      <ProfileAvatar profile={selectedSelf} />
                      <div><strong>{getProfileDisplayName(selectedSelf)}</strong><span>{[selectedSelf.occupation, selectedSelf.city].filter(Boolean).join(' · ')}</span></div>
                    </div>
                    <div className="compact-preferences">
                      <span className="compact-preferences__label">Интересы</span>
                      <div className="chip-row">{selfDomains.map((domain) => <button type="button" className={`chip${selectedInterests.includes(domain) ? ' is-active' : ''}`} onClick={() => { toggleInterest(domain); setRefreshSeed(0); }} key={domain}>{domain}</button>)}</div>
                      <span className="compact-preferences__label">Вызовы</span>
                      <div className="chip-row">{selfChallenges.map((challenge) => <button type="button" className={`chip${selectedChallenges.includes(challenge) ? ' is-active' : ''}`} onClick={() => { toggleChallenge(challenge); setRefreshSeed(0); }} key={challenge}>{challenge}</button>)}</div>
                    </div>
                  </div>
                ) : <p className="muted self-hint">Выбери свою визитку — рекомендации станут персональными.</p>}
              </>
            )}
          </article>

          <article className="panel panel--recommendations">
            <div className="panel__heading panel__heading--row">
              <div><h2>Подобрано для тебя</h2><p>Братья, которые ближе всего к твоим задачам и интересам.</p></div>
              <button
                className="icon-button recommendation-refresh"
                type="button"
                aria-label="Обновить подборку"
                title="Обновить подборку"
                disabled={recommendationPool.length === 0}
                onClick={() => setRefreshSeed((value) => value + 1)}
              ><RefreshCw size={17} strokeWidth={1.8} aria-hidden="true" /></button>
            </div>
            <div className="recommendation-grid" data-refresh-seed={refreshSeed}>
              {recommendationProfiles.length > 0 ? recommendationProfiles.map(({ profile, recommendation }) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  favorite={favoriteProfileIds.includes(profile.id)}
                  reason={recommendation.reasons[0]?.label ?? tierLabels[recommendation.tier]}
                  variant="compact"
                  onOpen={() => setOpenedProfile(profile)}
                  onToggleFavorite={() => toggleFavorite(profile.id)}
                />
              )) : [0, 1, 2, 3].map((index) => (
                <div className="recommendation-empty" key={index}><span className="recommendation-empty__avatar" /><span>{profiles.length === 0 ? 'После импорта' : selectedSelf ? 'Добавь интересы или вызовы' : 'Сначала выбери себя'}</span></div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel favorites-strip">
          <div className="section-heading"><h2>Мои братья <span>{favoriteProfileIds.length}</span></h2><Link to="/brothers">Смотреть всех <ArrowRight size={15} /></Link></div>
          {favorites.length > 0 ? <div className="favorite-row">{favorites.map((profile) => (
            <button className="favorite-person" type="button" key={profile.id} onClick={() => setOpenedProfile(profile)}>
              <ProfileAvatar profile={profile} size="sm" /><span><strong>{getProfileDisplayName(profile)}</strong><small>{profile.domains[0] ?? profile.occupation ?? 'Участник'}</small></span>
            </button>
          ))}</div> : <p className="muted favorites-empty">Нажми на звезду в карточке — сохранённые братья появятся здесь.</p>}
        </section>

        <section className="insight-grid">
          <article className="panel domains-panel">
            <div className="section-heading"><h2>Сферы сообщества</h2><Link to="/domains">Смотреть все <ArrowRight size={15} /></Link></div>
            <div className="domain-grid-v1">
              {HOME_DOMAINS.map((domain) => {
                const count = domainCounts.get(domain) ?? 0;
                return (
                  <button type="button" className="domain-tile-v1" key={domain} onClick={() => navigate(`/domains?domain=${encodeURIComponent(domain)}`)}>
                    <DomainArtwork domain={domain} />
                    <span className="domain-tile-v1__shade" aria-hidden="true" />
                    <span className="domain-tile-v1__content"><strong>{domain}</strong><small>{count} {pluralBrothers(count)}</small></span>
                    <ArrowRight className="domain-tile-v1__arrow" size={16} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </article>

          <article className="panel challenges-panel">
            <div className="section-heading"><h2>Кто проходит через похожие вызовы</h2><Link to="/challenges">Смотреть все <ArrowRight size={15} /></Link></div>
            {challengeCounts.length > 0 ? <div className="challenge-list">{challengeCounts.map(([challenge, count]) => {
              const preview = profiles.filter((profile) => profile.challenges.includes(challenge)).slice(0, 4);
              return (
                <button className="challenge-row" type="button" key={challenge} onClick={() => navigate(`/challenges?challenge=${encodeURIComponent(challenge)}`)}>
                  <span className="challenge-row__icon"><Users size={17} strokeWidth={1.7} /></span>
                  <span className="challenge-row__text"><strong>{challenge}</strong><small>{count} {pluralBrothers(count)}</small></span>
                  <span className="avatar-stack">{preview.map((profile) => <ProfileAvatar profile={profile} size="sm" key={profile.id} />)}</span>
                  <ArrowRight size={16} />
                </button>
              );
            })}</div> : <div className="challenges-empty"><span className="challenge-row__icon"><Users size={18} /></span><p>После импорта здесь появятся реальные похожие вызовы сообщества.</p></div>}
          </article>
        </section>
      </div>

      <ProfileDialog profile={openedProfile} favorite={openedProfile ? favoriteProfileIds.includes(openedProfile.id) : false} onClose={() => setOpenedProfile(undefined)} onToggleFavorite={() => openedProfile && toggleFavorite(openedProfile.id)} />
    </div>
  );
}
