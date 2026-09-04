import { CheckCircle2, FileUp, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../app/AppDataContext';

export function ImportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { importFile, profiles } = useAppData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const result = await importFile(file);
      setMessage(`Импортировано ${result.profiles.length} визиток. В локальной базе: ${result.stats.totalStored}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось импортировать файл. Текущая база не изменена.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="import-page">
      <header className="page-heading"><span className="eyebrow eyebrow--gold">ЛОКАЛЬНЫЙ ИМПОРТ</span><h1>Загрузите визитки сообщества</h1><p>Экспортируй тему с визитками из Telegram Desktop в формате HTML и выбери файл <strong>messages.html</strong>.</p></header>
      <div className="import-layout">
        <article className="panel import-dropzone">
          <FileUp size={34} strokeWidth={1.5} />
          <h2>{profiles.length ? 'Обновить выгрузку' : 'Выбрать messages.html'}</h2>
          <p>Повторный импорт обновляет людей по стабильным ID и не сбрасывает «Мои братья» или выбранного себя.</p>
          <input ref={inputRef} type="file" accept=".html,text/html" hidden onChange={(event) => void handleFile(event.target.files?.[0])} />
          <button className="button button--primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Обрабатываю…' : profiles.length ? 'Обновить выгрузку' : 'Загрузить messages.html'}</button>
          {message && <div className="status-message status-message--success"><CheckCircle2 size={18} />{message}<button type="button" onClick={() => navigate('/')}>Перейти на главную</button></div>}
          {error && <div className="status-message status-message--error">{error}</div>}
        </article>
        <aside className="panel privacy-card"><ShieldCheck size={26} /><h2>Визитки остаются у тебя</h2><p>Файл разбирается прямо в браузере. Профили сохраняются в IndexedDB на этом устройстве и не отправляются на сервер.</p><ol><li>Telegram Desktop → нужная группа</li><li>Открой тему «Визитка - представление»</li><li>Экспорт истории → HTML</li><li>Загрузи messages.html здесь</li></ol></aside>
      </div>
    </section>
  );
}
