import type { CSSProperties } from 'react';
import { APPROVED_AVATAR_SPRITE_HQ } from '../assets/brand/avatar-sprite-hq';
import type { Profile } from '../types/profile';

const AVATAR_POSITIONS = [
  ['0%', '0%'],
  ['50%', '0%'],
  ['100%', '0%'],
  ['0%', '100%'],
  ['50%', '100%'],
  ['100%', '100%'],
] as const;

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const seed = seedNumber(profile.avatarSeed || profile.id);
  const avatarIndex = seed % AVATAR_POSITIONS.length;
  const [positionX, positionY] = AVATAR_POSITIONS[avatarIndex];
  const style: CSSProperties = {
    aspectRatio: '1 / 1',
    overflow: 'visible',
    border: 0,
    borderRadius: 0,
    padding: 0,
    backgroundColor: 'transparent',
    backgroundImage: `url("${APPROVED_AVATAR_SPRITE_HQ}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '300% 200%',
    backgroundPosition: `${positionX} ${positionY}`,
    boxShadow: 'none',
    lineHeight: 0,
    transform: 'none',
    filter: 'none',
  };

  return (
    <span
      className={`profile-avatar profile-avatar--${size}`}
      aria-hidden="true"
      data-avatar-index={avatarIndex}
      style={style}
    />
  );
}
