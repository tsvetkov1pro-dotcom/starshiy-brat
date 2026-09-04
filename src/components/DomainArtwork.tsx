import { SPHERE_POSITIONS, SPHERE_SHEET } from '../assets/brand/sphere-sheet';

export function DomainArtwork({ domain }: { domain: string }) {
  return (
    <span
      className="domain-tile-v1__art"
      style={{
        backgroundImage: `url(${SPHERE_SHEET})`,
        backgroundPosition: SPHERE_POSITIONS[domain] ?? '0% 0%',
      }}
      aria-hidden="true"
    />
  );
}
