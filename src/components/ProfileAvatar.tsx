import type { CSSProperties } from 'react';
import { APPROVED_AVATARS } from '../assets/brand/avatars';
import type { Profile } from '../types/profile';

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

const frameStyle: CSSProperties = {
  aspectRatio: '1 / 1',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  border: '2px solid #fffaf0',
  borderRadius: '50%',
  padding: 0,
  background: '#1b1814',
  boxShadow: '0 0 0 1px rgba(126, 87, 37, .45), 0 4px 12px rgba(31, 25, 18, .14)',
  lineHeight: 0,
};

const imageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  objectPosition: '50% 50%',
  borderRadius: '50%',
  transform: 'translate(-10%, -7%) scale(1.14)',
  transformOrigin: '50% 50%',
  filter: 'none',
  imageRendering: 'auto',
};

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const seed = seedNumber(profile.avatarSeed || profile.id);
  const avatarIndex = seed % APPROVED_AVATARS.length;
  const source = APPROVED_AVATARS[avatarIndex];

  return (
    <span
      className={`profile-avatar profile-avatar--${size}`}
      aria-hidden="true"
      data-avatar-index={avatarIndex}
      style={frameStyle}
    >
      <img
        src={source}
        alt=""
        width={88}
        height={88}
        decoding="async"
        draggable={false}
        style={imageStyle}
      />
    </span>
  );
}
