import { APPROVED_AVATARS } from '../assets/brand/avatars';
import type { Profile } from '../types/profile';

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const seed = seedNumber(profile.avatarSeed || profile.id);
  const source = APPROVED_AVATARS[seed % APPROVED_AVATARS.length];

  return (
    <span className={`profile-avatar profile-avatar--${size}`} aria-hidden="true">
      <img src={source} alt="" draggable={false} />
    </span>
  );
}
