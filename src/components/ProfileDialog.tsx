import { Check, Copy, ExternalLink, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getProfileDisplayName } from '../lib/profile-normalization';
import type { Profile } from '../types/profile';
import { HighlightText } from './HighlightText';
import { ProfileAvatar } from './ProfileAvatar';

function Field({ label, value, terms = [] }: { label: string; value?: string | number; terms?: string[] }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="profile-field">
      <span>{label}</span>
      <p><HighlightText text={String(value)} terms={terms} /></p>
    </div>
  );
}

function PrimaryBlock({ label, value, terms = [] }: { label: string; value?: string; terms?: string[] }) {
  return (
    <article className={`profile-primary${value ? '' : ' is-empty'}`}>
      <span>{label}</span>
      <p>{value ? <HighlightText text={value} terms={terms} /> : 'Не указано в визитке'}</p>
    </article>
  );
}

export function ProfileDialog({
  profile,
  favorite,
  highlightTerms = [],
  contextLabel,
  onClose,
  onToggleFavorite,
}: {
  profile?: Profile;
  favorite: boolean;
  highlightTerms?: string[];
  contextLabel?: string;
  onClose: () => void;
  onToggleFavorite: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!profile || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [profile]);

  if (!profile) return null;
  const title = getProfileDisplayName(profile);
  const telegramUsername = profile.telegramUsername?.trim();
  const contact = telegramUsername ? `@${telegramUsername}` : title;

  async function copyContact() {
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
    >
      <div className="profile-sheet">
        <header className="profile-sheet__header">
          <ProfileAvatar profile={profile} size="lg" />
          <div className="profile-sheet__identity">
            {contextLabel && <span className="profile-context">{contextLabel}</span>}
            <h2><HighlightText text={title} terms={highlightTerms} /></h2>
            <p><HighlightText text={[profile.city, profile.age ? `${profile.age} лет` : undefined].filter(Boolean).join(' · ') || profile.telegramDisplayName} terms={highlightTerms} /></p>
          </div>
          <button className="icon-button" type="button" onClick={onToggleFavorite} aria-label={favorite ? 'Убрать из Моих братьев' : 'Добавить в Мои братья'}>
            <Star size={19} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>
        </header>

        <section className="profile-sheet__priority" aria-label="Главное о брате">
          <PrimaryBlock label="Чем занимается" value={profile.occupation} terms={highlightTerms} />
          <PrimaryBlock label="Чем может быть полезен" value={profile.canHelpWith} terms={highlightTerms} />
        </section>

        <section className="profile-sheet__secondary">
          <h3>Сейчас</h3>
          <Field label="Что сейчас важно" value={profile.currentPriority} terms={highlightTerms} />
          <Field label="Какой вызов проходит" value={profile.currentChallenge} terms={highlightTerms} />
          <Field label="Цель на 90 дней" value={profile.goal90Days} terms={highlightTerms} />
          <Field label="Город" value={profile.city} terms={highlightTerms} />
          <Field label="Возраст" value={profile.age ? `${profile.age} лет` : undefined} />
        </section>

        <section className="telegram-contact" aria-label={telegramUsername ? 'Telegram' : 'Контакт'}>
          <div>
            <span>{telegramUsername ? 'Telegram' : 'Имя для поиска в чате'}</span>
            <strong>{contact}</strong>
          </div>
          <button className="button button--secondary" type="button" onClick={copyContact}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано' : telegramUsername ? 'Скопировать ник' : 'Скопировать имя'}
          </button>
          {telegramUsername && (
            <a className="button button--primary" href={`https://t.me/${telegramUsername}`} target="_blank" rel="noreferrer">
              Открыть в Telegram <ExternalLink size={15} />
            </a>
          )}
        </section>

        <section className="profile-sheet__full">
          <details>
            <summary>Полная визитка</summary>
            <p className="raw-profile-text"><HighlightText text={profile.rawProfileText} terms={highlightTerms} /></p>
          </details>
        </section>
      </div>
    </dialog>
  );
}
