import { BRAND_LOGO } from '../assets/brand/logo';

export function BrandLogo({ compact = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span className={`brand-logo-approved${compact ? ' brand-logo-approved--compact' : ''}`} aria-label="Старший Брат">
      <img src={BRAND_LOGO} alt="" draggable={false} />
    </span>
  );
}
