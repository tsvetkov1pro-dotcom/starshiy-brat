import { Search, Sparkles } from 'lucide-react';
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { getSearchSuggestions, type SearchSuggestion } from '../lib/search-engine';
import type { Profile } from '../types/profile';

interface SearchBoxProps {
  profiles: Profile[];
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  onSelectPerson?: (profileId: string, sourceQuery: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  style?: CSSProperties;
  barStyle?: CSSProperties;
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
  onSelectPerson,
  placeholder = 'Кого ищешь? Например: IT, продажи, стройка…',
  buttonLabel,
  className = '',
  style,
  barStyle,
}: SearchBoxProps) {
  const listboxId = useId();
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(() => getSearchSuggestions(profiles, value, 20), [profiles, value]);
  const open = focused && !dismissed && value.trim().length >= 2 && suggestions.length > 0;

  function selectSuggestion(suggestion: SearchSuggestion) {
    setActiveIndex(-1);
    setDismissed(true);

    if (suggestion.type === 'person' && suggestion.profileId && onSelectPerson) {
      onSelectPerson(suggestion.profileId, value.trim());
      return;
    }

    onChange(suggestion.value);
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
    setActiveIndex(-1);
    onSearch(trimmed);
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex((current) => Math.min(suggestions.length - 1, current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex((current) => Math.max(-1, current - 1));
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDismissed(true);
      setActiveIndex(-1);
    }
  }

  return (
    <form className={`smart-search ${className}`.trim()} style={style} onSubmit={submit} role="search">
      <div className="smart-search__bar" style={barStyle}>
        <Search className="smart-search__icon" size={21} strokeWidth={1.75} aria-hidden="true" />
        <input
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
        {buttonLabel && <button className="button button--primary smart-search__submit" type="submit">{buttonLabel}</button>}
      </div>

      {open && (
        <div className="search-assistant" id={listboxId} role="listbox" aria-label="Подсказки поиска">
          <div className="search-assistant__head">
            <Sparkles size={15} aria-hidden="true" />
            <span>Ищу по именам, сферам, компетенциям, задачам и всему тексту визиток</span>
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
