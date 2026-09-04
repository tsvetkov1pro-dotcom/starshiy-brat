import { Star } from 'lucide-react';
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
  const subtitle = [profile.domains[0] ?? profile.occupation, profile.city].filter(Boolean).join(' · ');

  return (
    <article className="profile-card">
      <button
        className="icon-button profile-card__star"
        type="button"
        aria-label={favorite ? `Убрать ${title} из Моих братьев` : `Добавить ${title} в Мои братья`}
        onClick={onToggleFavorite}
      >
        <Star size={15} strokeWidth={1.7} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <button className="profile-card__open" type="button" onClick={onOpen}>
        <ProfileAvatar profile={profile} />
        <span className="profile-card__body">
          <strong>{title}</strong>
          <small>{subtitle || 'Участник сообщества'}</small>
          {reason && <span className="profile-card__reason">{reason}</span>}
        </span>
      </button>
    </article>
  );
}
