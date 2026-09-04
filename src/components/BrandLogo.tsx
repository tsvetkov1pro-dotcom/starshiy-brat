import { BRAND_LOGO } from '../assets/brand/logo';

export function BrandLogo({ compact = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <img
      className={`brand__logo${compact ? ' brand__logo--compact' : ''}`}
      src={BRAND_LOGO}
      alt="Старший Брат"
      draggable={false}
    />
  );
}
