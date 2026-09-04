import { Crown } from 'lucide-react';

export function BrandLogo({ compact = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span
      className={`brand-wordmark${compact ? ' brand-wordmark--compact' : ''}`}
      aria-label="Старший Брат"
      role="img"
    >
      <Crown className="brand-wordmark__crown" aria-hidden="true" />
      <span className="brand-wordmark__top">СТАРШИЙ</span>
      <span className="brand-wordmark__bottom">БРАТ</span>
    </span>
  );
}
