import { Search, Sparkles } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { getSearchSuggestions, type SearchSuggestion } from '../lib/search-engine';
import type { Profile } from '../types/profile';

interface SearchBoxProps {
  profiles: Profile[];
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}

const typeLabel: Record<SearchSuggestion['type'], string> = {
  person: 'Брат',
  domain: 'Сфера',
  challenge: 'Вызов',
  related: 'Связанный запрос',
};

export function SearchBox({
  profiles,
  value,
  onChange,
  onSearch,
  placeholder = 'Кого ищешь? Например: IT, продажи, стройка…',
  buttonLabel = 'Найти брата',
  className = '',
}: SearchBoxProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(() => getSearchSuggestions(profiles, value, 8), [profiles, value]);
  const open = focused && !dismissed && value.trim().length >= 1 && suggestions.length > 0;

  function selectSuggestion(suggestion: SearchSuggestion) {
    onChange(suggestion.value);
    setActiveIndex(-1);
    setDismissed(true);
    onSearch(suggestion.value);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (open && activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    const trimmed = value.trim();
    setDismissed(true);
    onSearch(trimmed);
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex((current) => Math.min(suggestions.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex((current) => Math.max(-1, current - 1));
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setDismissed(true);
      setActiveIndex(-1);
    }
  }

  return (
    <form className={`smart-search ${className}`.trim()} onSubmit={submit} role="search">
      <div
        className="smart-search__bar"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return;
          if (document.activeElement !== inputRef.current) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <Search size={20} strokeWidth={1.8} aria-hidden="true" />
        <input
          ref={inputRef}
          aria-label="Поиск"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setDismissed(false);
            setActiveIndex(-1);
          }}
          onFocus={() => { setFocused(true); setDismissed(false); }}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={keyDown}
        />
        <button className="button button--primary smart-search__submit" type="submit">{buttonLabel}</button>
      </div>

      {open && (
        <div className="search-assistant" id={listboxId} role="listbox" aria-label="Подсказки поиска">
          <div className="search-assistant__head">
            <Sparkles size={15} aria-hidden="true" />
            <span>Поиск понимает словоформы и связанные понятия</span>
          </div>
          <div className="search-assistant__list">
            {suggestions.map((suggestion, index) => (
              <button
                className={`search-suggestion${index === activeIndex ? ' is-active' : ''}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="search-suggestion__type">{typeLabel[suggestion.type]}</span>
                <span className="search-suggestion__content">
                  <strong>{suggestion.label}</strong>
                  {suggestion.subtitle && <small>{suggestion.subtitle}</small>}
                </span>
                <span className="search-suggestion__enter">↵</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
