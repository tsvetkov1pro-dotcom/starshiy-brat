export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className={`brand-logo${compact ? ' brand-logo--compact' : ''}${inverse ? ' brand-logo--inverse' : ''}`} aria-label="Старший Брат">
      <svg className="brand-logo__crown" viewBox="0 0 72 38" aria-hidden="true">
        <path d="M7 28 15 9l17 14L40 4l10 19L64 10l1 19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 33h55" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      <div className="brand-logo__words">
        <span>СТАРШИЙ</span>
        <strong>БРАТ</strong>
      </div>
    </div>
  );
}
