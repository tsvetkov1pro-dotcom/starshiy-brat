import type { Profile } from '../types/profile';

function initials(profile: Profile): string {
  return (profile.name ?? profile.telegramDisplayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'СБ';
}

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const seed = seedNumber(profile.avatarSeed || profile.id);
  return (
    <div className={`profile-avatar profile-avatar--${size}`} style={{ '--avatar-shift': `${seed % 28}%` } as React.CSSProperties} aria-hidden="true">
      <span className="profile-avatar__crown">♔</span>
      <strong>{initials(profile)}</strong>
    </div>
  );
}
