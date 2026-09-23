import { IconButton, MaxUI } from '@maxhub/max-ui';
import { ArrowLeft, BriefcaseBusiness, Moon, PackageSearch, Sun, UserRound } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => undefined });

export function useTheme() {
  return useContext(ThemeContext);
}

const navItems = [
  { to: '/orders', label: 'Заказы', icon: PackageSearch },
  { to: '/services', label: 'Услуги', icon: BriefcaseBusiness },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];

function Navigation() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'is-active' : undefined}>
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isRootScreen = ['/orders', '/services', '/profile'].includes(location.pathname);
  const title = location.pathname.startsWith('/orders/')
    ? 'Заказ'
    : location.pathname === '/schedule'
      ? 'Расписание'
      : location.pathname.includes('/create') || location.pathname.endsWith('/new')
      ? 'Новый заказ'
      : location.pathname.includes('/edit')
        ? 'Редактирование'
      : location.pathname.startsWith('/services/')
        ? 'Услуга'
        : 'MAX Заказы';

  return (
    <header className="app-header">
      <div className="header-side">
        {!isRootScreen && (
          <IconButton variant="ghost" size="small" aria-label="Назад" onClick={() => navigate(-1)}>
            <ArrowLeft size={21} />
          </IconButton>
        )}
      </div>
      <strong>{title}</strong>
      <div className="header-side header-side-right">
        <IconButton variant="ghost" size="small" aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'} onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </IconButton>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') }), [theme]);
  useEffect(() => { window.scrollTo({ top: 0, left: 0 }); }, [location.pathname]);
  return (
    <ThemeContext.Provider value={value}>
      <MaxUI colorScheme={theme} platform="ios" className="maxui-root">
        <div className="app" data-theme={theme}>
          <aside className="desktop-sidebar">
            <div className="brand-mark">M</div>
            <div className="brand-copy"><strong>MAX Заказы</strong><span>Работа без лишних чатов</span></div>
            <Navigation />
            <p className="sidebar-caption">Сервисный кабинет</p>
          </aside>
          <div className="app-column">
            <AppHeader />
            <main className="page-content">{children}</main>
            <Navigation />
          </div>
        </div>
      </MaxUI>
    </ThemeContext.Provider>
  );
}
