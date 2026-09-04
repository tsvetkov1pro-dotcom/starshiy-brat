import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const emptyCards = [
  { title: 'Подобрано для тебя', text: 'Выбери себя и импортируй визитки, чтобы получить персональные рекомендации.' },
  { title: 'Мои братья', text: 'Сохранённые участники появятся здесь.' },
  { title: 'Сферы сообщества', text: 'После импорта здесь появится интерактивная карта сфер.' },
  { title: 'Похожие вызовы', text: 'После классификации здесь появятся люди с похожими задачами.' },
];

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__content">
          <span className="eyebrow">СТАРШИЙ БРАТ · НАВИГАТОР ПО СООБЩЕСТВУ</span>
          <h1 id="hero-title">Найди того, кто уже проходил через это</h1>
          <p>Опыт братьев рядом. Поддержка без лишних слов.</p>
        </div>
      </section>

      <section className="search-bridge" aria-label="Поиск по сообществу">
        <Search size={20} aria-hidden="true" />
        <input aria-label="Поиск" placeholder="Кого ищешь? Например: IT, продажи, стройка…" disabled />
        <Link className="button button--primary" to="/find">Найти брата</Link>
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--self">
          <div className="panel__heading">
            <div><span className="eyebrow eyebrow--gold">ПЕРСОНАЛИЗАЦИЯ</span><h2>Выберите себя</h2></div>
          </div>
          <p className="muted">После импорта Telegram-визиток здесь можно будет найти собственную анкету и настроить интересы и вызовы.</p>
          <Link className="button button--secondary" to="/import">Импортировать визитки <ArrowRight size={16} /></Link>
        </article>

        <article className="panel panel--recommendations">
          <div className="panel__heading"><div><span className="eyebrow eyebrow--gold">ПОДБОР</span><h2>Подобрано для тебя</h2></div></div>
          <div className="recommendation-skeletons" aria-label="Рекомендации пока пусты">
            {[0,1,2,3].map((index) => <div className="recommendation-empty" key={index}><div className="avatar-placeholder" /><span>Нет данных</span></div>)}
          </div>
        </article>
      </section>

      <section className="overview-grid">
        {emptyCards.slice(1).map((card) => (
          <article className="panel overview-card" key={card.title}>
            <h2>{card.title}</h2>
            <p className="muted">{card.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
