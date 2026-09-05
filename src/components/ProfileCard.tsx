import { Star } from 'lucide-react';
import { getProfileDisplayName } from '../lib/profile-normalization';
import { getProfilePreviewText } from '../lib/profile-preview';
import type { SearchExcerpt } from '../lib/search-engine';
import type { Profile } from '../types/profile';
import { HighlightText } from './HighlightText';
import { ProfileAvatar } from './ProfileAvatar';
import { CopyNameButton } from './CopyNameButton';

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
  const previewText = excerpt?.text ?? getProfilePreviewText(profile);
  const classes = [
    'profile-card',
    `profile-card--${variant}`,
    previewText ? 'profile-card--has-excerpt' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <button
        className="icon-button profile-card__star"
        type="button"
        aria-label={favorite ? `Убрать ${title} из Моих братьев` : `Добавить ${title} в Мои братья`}
        onClick={onToggleFavorite}
      >
        <Star size={15} strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <button className="profile-card__open" type="button" aria-label={`Открыть визитку: ${title}`} onClick={onOpen} />
      <div className="profile-card__content">
        <ProfileAvatar profile={profile} size="md" />
        <span className="profile-card__body">
          <span className="profile-card__name-row">
            <strong className="profile-card__title" title={title}><HighlightText text={title} terms={highlightTerms} /></strong>
            <CopyNameButton name={title} />
          </span>
          <small className="profile-card__meta"><HighlightText text={meta} terms={highlightTerms} /></small>
          {reason && <span className="profile-card__reason"><HighlightText text={reason} terms={highlightTerms} /></span>}
          {variant === 'result' && previewText && (
            <span className="profile-card__excerpt">
              {excerpt?.label && <span>{excerpt.label}</span>}
              <q><HighlightText text={previewText} terms={highlightTerms} /></q>
            </span>
          )}
        </span>
      </div>
    </article>
  );
}
