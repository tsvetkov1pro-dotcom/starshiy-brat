import { BRAND_LOGO } from '../assets/brand/logo';

export function BrandLogo({ compact = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <img
      className={`brand-wordmark brand-wordmark--image${compact ? ' brand-wordmark--compact' : ''}`}
      src={BRAND_LOGO}
      alt="Старший Брат"
      draggable={false}
    />
  );
}
