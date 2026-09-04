import { APPROVED_LOGO } from '../assets/brand/logo-clean';

export function BrandLogo({ compact = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <img
      className={`brand-wordmark brand-wordmark--image${compact ? ' brand-wordmark--compact' : ''}`}
      src={APPROVED_LOGO}
      alt="Старший Брат"
      draggable={false}
    />
  );
}
