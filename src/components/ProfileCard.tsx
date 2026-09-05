import { Star } from 'lucide-react';
import { getProfileDisplayName } from '../lib/profile-normalization';
import { getProfilePreviewText } from '../lib/profile-preview';
import type { SearchExcerpt } from '../lib/search-engine';
import type { Profile } from '../types/profile';
import { HighlightText } from './HighlightText';
import { ProfileAvatar } from './ProfileAvatar';
import { CopyNameButton } from './CopyNameButton';

function buildDesktopAboutLine(profile: Profile): string {
  const domain = profile.domains.find((item) => item && item !== 'Другое')?.trim();
  const occupation = profile.occupation?.trim();
  const city = profile.city?.trim();
  const parts = [domain, occupation, city].filter((value): value is string => Boolean(value));
  const unique: string[] = [];

  for (const part of parts) {
    const normalized = part.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized) continue;
    if (unique.some((item) => item.toLowerCase().replace(/\s+/g, ' ').trim() === normalized)) continue;
    unique.push(part);
  }

  return unique.join(' · ') || 'Участник сообщества';
}

function buildLegacyMeta(profile: Profile): string {
  const metaPrimary = profile.domains[0] && profile.domains[0] !== 'Другое' ? profile.domains[0] : profile.occupation;
  return [metaPrimary, profile.city].filter(Boolean).join(' · ') || 'Участник сообщества';
}

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
  const isDesktopResult = variant === 'result' && typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches;
  const meta = isDesktopResult ? buildDesktopAboutLine(profile) : buildLegacyMeta(profile);
  const helpText = profile.canHelpWith?.trim() || 'Не указано в визитке';
  const previewText = excerpt?.text ?? getProfilePreviewText(profile);
  const hasExcerpt = isDesktopResult || Boolean(previewText);
  const classes = [
    'profile-card',
    `profile-card--${variant}`,
    hasExcerpt ? 'profile-card--has-excerpt' : '',
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
          {!isDesktopResult && reason && <span className="profile-card__reason"><HighlightText text={reason} terms={highlightTerms} /></span>}
          {isDesktopResult ? (
            <span className="profile-card__excerpt">
              <span>ЧЕМ МОЖЕТ ПОМОЧЬ</span>
              <q><HighlightText text={helpText} terms={highlightTerms} /></q>
            </span>
          ) : variant === 'result' && previewText ? (
            <span className="profile-card__excerpt">
              {excerpt?.label && <span>{excerpt.label}</span>}
              <q><HighlightText text={previewText} terms={highlightTerms} /></q>
            </span>
          ) : null}
        </span>
      </div>
    </article>
  );
}
