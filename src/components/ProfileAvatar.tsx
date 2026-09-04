import type { Profile } from '../types/profile';

function seedNumber(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const variant = seedNumber(profile.avatarSeed || profile.id) % 6;
  const id = `av-${profile.id.replace(/[^a-z0-9]/gi, '').slice(-8)}-${variant}`;

  return (
    <span className={`profile-avatar profile-avatar--${size}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d09a" />
            <stop offset=".55" stopColor="#b77a3d" />
            <stop offset="1" stopColor="#28211b" />
          </linearGradient>
          <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2622" />
            <stop offset="1" stopColor="#0b0b0a" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id}-bg)`} />
        <g opacity=".35" fill="#3e3024">
          <rect x="4" y="52" width="18" height="48" /><rect x="25" y="42" width="16" height="58" /><rect x="44" y="58" width="14" height="42" /><rect x="62" y="34" width="14" height="66" /><rect x="80" y="49" width="16" height="51" />
        </g>
        <g opacity=".45" fill="#f1bd72">
          <rect x="9" y="58" width="3" height="4" /><rect x="31" y="50" width="3" height="4" /><rect x="68" y="43" width="3" height="4" /><rect x="87" y="58" width="3" height="4" />
        </g>

        {variant === 4 ? (
          <g>
            <path d="M26 94c2-32 11-57 25-61 15 4 25 29 27 61z" fill={`url(#${id}-coat)`} />
            <path d="M31 53c5-20 14-32 24-34 12 5 19 17 22 34-10-7-18-10-24-10-8 0-15 3-22 10z" fill="#171513" />
            <path d="M44 37c4-8 14-9 20-2-2 12-5 19-10 21-6-3-9-9-10-19z" fill="#b47a43" opacity=".65" />
          </g>
        ) : (
          <g transform={variant % 2 === 0 ? 'translate(2 0)' : 'translate(-2 0)'}>
            <path d="M20 99c4-27 18-43 34-44 18 2 29 18 32 44z" fill={`url(#${id}-coat)`} />
            <ellipse cx="54" cy="39" rx="18" ry="22" fill="#c58a50" />
            <path d="M37 37c0-16 8-25 20-25 11 1 17 7 19 16-10-5-22-6-39 9z" fill="#171513" />
            {variant === 0 || variant === 5 ? <path d="M36 26c9-11 25-14 38-4l11 7c-14-2-31 0-47 7z" fill="#0c0c0b" /> : null}
            {variant === 1 || variant === 3 || variant === 5 ? <path d="M42 46c4 12 9 18 17 18 8 0 13-6 16-18-6 5-11 7-16 7-6 0-11-2-17-7z" fill="#241a13" /> : null}
            <path d="M65 38h8" stroke="#2a211a" strokeWidth="2" strokeLinecap="round" />
            <path d="M63 47c-4 3-9 3-13 0" fill="none" stroke="#6d462b" strokeWidth="1.8" strokeLinecap="round" />
            {variant === 2 ? <path d="M31 26c7-13 26-20 43-8" fill="none" stroke="#191613" strokeWidth="7" strokeLinecap="round" /> : null}
          </g>
        )}
        <circle cx="50" cy="50" r="47" fill="none" stroke="#f1c278" strokeWidth="2" opacity=".85" />
      </svg>
    </span>
  );
}
