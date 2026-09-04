import { Star } from 'lucide-react';
import { getProfileDisplayName } from '../lib/profile-normalization';
import type { SearchExcerpt } from '../lib/search-engine';
import type { Profile } from '../types/profile';
import { HighlightText } from './HighlightText';
import { ProfileAvatar } from './ProfileAvatar';

export function ProfileCard({
  profile,
  favorite,
  reason,
  excerpt,
  highlightTerms = [],
  variant = 'compact',
  onOpen,
  onToggleFavorite,
}: {
  profile: Profile;
  favorite: boolean;
  reason?: string;
  excerpt?: SearchExcerpt;
  highlightTerms?: string[];
  variant?: 'compact' | 'result';
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const title = getProfileDisplayName(profile);
  const metaPrimary = profile.domains[0] && profile.domains[0] !== 'Другое' ? profile.domains[0] : profile.occupation;
  const meta = [metaPrimary, profile.city].filter(Boolean).join(' · ') || 'Участник сообщества';

  return (
    <article className={`profile-card profile-card--${variant}`}>
      <button
        className="icon-button profile-card__star"
        type="button"
        aria-label={favorite ? `Убрать ${title} из Моих братьев` : `Добавить ${title} в Мои братья`}
        onClick={onToggleFavorite}
      >
        <Star size={15} strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <button className="profile-card__open" type="button" onClick={onOpen}>
        <ProfileAvatar profile={profile} size={variant === 'result' ? 'lg' : 'md'} />
        <span className="profile-card__body">
          <strong className="profile-card__title"><HighlightText text={title} terms={highlightTerms} /></strong>
          <small className="profile-card__meta"><HighlightText text={meta} terms={highlightTerms} /></small>
          {reason && <span className="profile-card__reason"><HighlightText text={reason} terms={highlightTerms} /></span>}
          {variant === 'result' && excerpt && (
            <span className="profile-card__excerpt">
              <span>{excerpt.label}</span>
              <q><HighlightText text={excerpt.text} terms={highlightTerms} /></q>
            </span>
          )}
        </span>
      </button>
    </article>
  );
}
