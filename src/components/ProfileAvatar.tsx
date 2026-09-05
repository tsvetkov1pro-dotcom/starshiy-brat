import type { CSSProperties } from 'react';
import { APPROVED_AVATARS } from '../assets/brand/avatars';
import type { Profile } from '../types/profile';

const avatarFrameStyle: CSSProperties = {
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  border: 0,
  borderRadius: '50%',
  padding: 1,
  background: 'transparent',
  boxShadow: 'none',
  lineHeight: 0,
};

const avatarImageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'contain',
  objectPosition: '50% 50%',
  borderRadius: '50%',
  transform: 'none',
  filter: 'none',
  imageRendering: 'auto',
};

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const seed = seedNumber(profile.avatarSeed || profile.id);
  const source = APPROVED_AVATARS[seed % APPROVED_AVATARS.length];

  return (
    <span className={`profile-avatar profile-avatar--${size}`} aria-hidden="true" style={avatarFrameStyle}>
      <img
        src={source}
        alt=""
        width={88}
        height={88}
        decoding="async"
        draggable={false}
        style={avatarImageStyle}
      />
    </span>
  );
}
