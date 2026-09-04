import { Boxes, Compass, Home, Search, Upload, Users, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { BRAND_LOGO } from '../../assets/brand/logo';

type NavItem = { to: string; label: string; icon: LucideIcon };

const desktopItems: NavItem[] = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/find', label: 'Найти брата', icon: Search },
  { to: '/brothers', label: 'Мои братья', icon: Users },
  { to: '/domains', label: 'Сферы', icon: Boxes },
  { to: '/challenges', label: 'Похожие вызовы', icon: Compass },
];

const mobileItems = [desktopItems[0], desktopItems[1], desktopItems[2], desktopItems[4]];

function Brand() {
  return (
    <NavLink to="/" className="brand" aria-label="Старший Брат — на главную">
      <img className="brand__logo" src={BRAND_LOGO} alt="Старший Брат" />
      <span>Навигатор по сообществу</span>
    </NavLink>
  );
}

function NavItems({ items }: { items: NavItem[] }) {
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
    >
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));
}

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="sidebar__nav" aria-label="Основная навигация">
          <NavItems items={desktopItems} />
        </nav>
        <NavLink
          to="/import"
          className={({ isActive }) => `nav-link sidebar__import${isActive ? ' is-active' : ''}`}
        >
          <Upload size={19} strokeWidth={1.8} aria-hidden="true" />
          <span>Импорт чата</span>
        </NavLink>
      </aside>

      <main className="main-content"><Outlet /></main>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        <NavItems items={mobileItems} />
      </nav>
    </div>
  );
}
