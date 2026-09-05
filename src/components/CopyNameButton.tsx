import { Check, Copy } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';

export function CopyNameButton({ name }: { name: string }) {
  const [status, setStatus] = useState('');
  const desktopButtonStyle: CSSProperties | undefined = typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches
    ? { display: 'inline-grid', placeItems: 'center' }
    : undefined;

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(''), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  return <>
    <button
      className="copy-name"
      type="button"
      title={`Скопировать имя: ${name}`}
      aria-label={`Скопировать имя: ${name}`}
      style={desktopButtonStyle}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(name);
          setStatus('Имя скопировано');
        } catch {
          setStatus('Не удалось скопировать имя');
        }
      }}
    >
      {status === 'Имя скопировано' ? <Check size={14} /> : <Copy size={14} />}
    </button>
    <span className="sr-only" role="status">{status}</span>
  </>;
}
