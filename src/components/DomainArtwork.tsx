import { SPHERE_POSITIONS, SPHERE_SHEET } from '../assets/brand/sphere-sheet';

export function DomainArtwork({ domain }: { domain: string }) {
  return (
    <span
      className="domain-tile-v1__art"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'block',
        width: '100%',
        height: '100%',
        backgroundImage: `url(${SPHERE_SHEET})`,
        backgroundPosition: SPHERE_POSITIONS[domain] ?? '0% 0%',
        backgroundSize: '300% 200%',
        backgroundRepeat: 'no-repeat',
      }}
      aria-hidden="true"
    />
  );
}
