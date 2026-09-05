import { useId, useMemo, useState } from 'react';
import { getProfileDisplayName } from '../lib/profile-normalization';
import { searchProfilesByName } from '../lib/search-engine/search';
import type { Profile } from '../types/profile';

export function SelfPicker({ profiles, onSelect }: { profiles: Profile[]; onSelect: (id: string) => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => searchProfilesByName(profiles, query), [profiles, query]);
  const results = matches.slice(0, 30);
  const expanded = open && query.trim().length >= 2;
  return <div className="self-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>Введите своё имя</label>
    <input id={id} role="combobox" autoComplete="off" placeholder="Например, Леонид"
      aria-expanded={expanded} aria-controls={`${id}-results`} aria-autocomplete="list"
      aria-activedescendant={expanded && results[active] ? `${id}-${active}` : undefined}
      value={query} onFocus={() => setOpen(true)}
      onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          setActive(current => Math.max(0, Math.min(results.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
        }
        if (event.key === 'Enter' && expanded && results[active]) { event.preventDefault(); onSelect(results[active].id); }
      }} />
    <p>Найдите свою визитку и нажмите на неё. Выбор сохранится.</p>
    {expanded && <div className="self-picker__popup">
      <p role="status">{matches.length ? `Найдено: ${matches.length}. Выберите себя.` : 'Никого не нашли. Проверьте имя или фамилию.'}</p>
      <div id={`${id}-results`} role="listbox" aria-label="Визитки для выбора себя">
        {results.map((profile, index) => <button key={profile.id} id={`${id}-${index}`} type="button" role="option"
          aria-selected={active === index} onMouseEnter={() => setActive(index)}
          onClick={() => onSelect(profile.id)}>
          <strong>{getProfileDisplayName(profile)}</strong>
          <span>{[profile.city, profile.occupation].filter(Boolean).join(' · ') || 'Участник сообщества'}</span>
          <small>Это я — выбрать</small>
        </button>)}
      </div>
      {matches.length > 30 && <p>Уточните имя или добавьте фамилию, чтобы увидеть нужную визитку.</p>}
    </div>}
  </div>;
}
