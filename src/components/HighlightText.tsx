import { Fragment } from 'react';
import { shouldHighlightToken } from '../lib/search-engine';

export function HighlightText({ text, terms = [] }: { text?: string; terms?: string[] }) {
  if (!text) return null;
  if (terms.length === 0) return <>{text}</>;

  const parts = text.split(/([A-Za-zА-Яа-яЁё0-9+#/.-]+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        return shouldHighlightToken(part, terms)
          ? <mark className="search-highlight" key={`${part}-${index}`}>{part}</mark>
          : <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}
