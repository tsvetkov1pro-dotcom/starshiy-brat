import { ArrowUpRight, Star } from 'lucide-react';
import type { Profile } from '../types/profile';
import { ProfileAvatar } from './ProfileAvatar';

export function ProfileCard({
  profile,
  favorite,
  reason,
  onOpen,
  onToggleFavorite,
}: {
  profile: Profile;
  favorite: boolean;
  reason?: string;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const title = profile.name ?? profile.telegramDisplayName;
  const subtitle = [profile.domains[0], profile.city].filter(Boolean).join(' · ');
  return (
    <article className="profile-card">
      <button className="icon-button profile-card__star" type="button" aria-label={favorite ? `Убрать ${title} из Моих братьев` : `Добавить ${title} в Мои братья`} onClick={onToggleFavorite}>
        <Star size={17} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
      <ProfileAvatar profile={profile} />
      <div className="profile-card__body">
        <h3>{title}</h3>
        <p className="profile-card__meta">{subtitle || profile.occupation || 'Участник сообщества'}</p>
        {reason && <p className="profile-card__reason">{reason}</p>}
        <button className="button button--card" type="button" onClick={onOpen}>Посмотреть <ArrowUpRight size={14} /></button>
      </div>
    </article>
  );
}
