import { Check, Copy, ExternalLink, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../types/profile';
import { ProfileAvatar } from './ProfileAvatar';

function Field({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null;
  return <div className="profile-field"><span>{label}</span><p>{value}</p></div>;
}

export function ProfileDialog({
  profile,
  favorite,
  onClose,
  onToggleFavorite,
}: {
  profile?: Profile;
  favorite: boolean;
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
  const title = profile.name ?? profile.telegramDisplayName;
  const contact = profile.telegramUsername ? `@${profile.telegramUsername}` : profile.telegramDisplayName;

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
    <dialog ref={dialogRef} className="profile-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <div className="profile-sheet">
        <header className="profile-sheet__header">
          <ProfileAvatar profile={profile} size="lg" />
          <div className="profile-sheet__identity">
            <span className="eyebrow eyebrow--gold">ВИЗИТКА БРАТА</span>
            <h2>{title}</h2>
            <p>{[profile.city, profile.age ? `${profile.age} лет` : undefined].filter(Boolean).join(' · ') || profile.telegramDisplayName}</p>
          </div>
          <button className="icon-button" type="button" onClick={onToggleFavorite} aria-label={favorite ? 'Убрать из Моих братьев' : 'Добавить в Мои братья'}><Star size={19} fill={favorite ? 'currentColor' : 'none'} /></button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>
        </header>

        <section className="profile-sheet__main" aria-label="Главное">
          <h3>Главное</h3>
          <Field label="Чем может помочь" value={profile.canHelpWith} />
          <Field label="Что сейчас важно" value={profile.currentPriority} />
          <Field label="Чем занимается" value={profile.occupation} />
          <div className="profile-sheet__tags">
            {profile.domains.slice(0, 4).map((domain) => <span className="tag tag--soft" key={domain}>{domain}</span>)}
            {profile.challenges.slice(0, 3).map((challenge) => <span className="tag" key={challenge}>{challenge}</span>)}
          </div>
        </section>

        <section className="telegram-contact" aria-label="Telegram">
          <div><span className="eyebrow">TELEGRAM</span><strong>{contact}</strong></div>
          <button className="button button--secondary" type="button" onClick={copyContact}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Скопировано' : profile.telegramUsername ? 'Скопировать ник' : 'Скопировать имя'}</button>
          {profile.telegramUsername && <a className="button button--primary" href={`https://t.me/${profile.telegramUsername}`} target="_blank" rel="noreferrer">Открыть в Telegram <ExternalLink size={15} /></a>}
        </section>

        <section className="profile-sheet__full">
          <h3>Полная визитка</h3>
          <Field label="Что сейчас тяжело" value={profile.currentChallenge} />
          <Field label="Что сейчас важно" value={profile.currentPriority} />
          <Field label="Цель на 90 дней" value={profile.goal90Days} />
          <Field label="Чем может быть полезен" value={profile.canHelpWith} />
          <details><summary>Исходный текст визитки</summary><p className="raw-profile-text">{profile.rawProfileText}</p></details>
        </section>
      </div>
    </dialog>
  );
}
