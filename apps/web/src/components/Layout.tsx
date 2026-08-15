import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Tags,
  BarChart3,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PwaInstallPrompt } from './PwaInstallPrompt';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/habits', label: 'Habits', icon: ListChecks, end: false },
  { to: '/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/stats', label: 'Statistics', icon: BarChart3, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="app-panel fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-black/5 px-6 dark:border-white/10">
          <div className="brand-mark h-9 w-9">
            <ListChecks size={18} />
          </div>
          <div>
            <span className="block font-bold leading-tight text-gray-900 dark:text-white">Habit</span>
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Build your rhythm</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${
                  isActive
                    ? 'nav-link-active'
                    : 'nav-link-idle'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-black/5 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-900 ring-4 ring-brand-300/10">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="btn-secondary flex-1" title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={handleLogout} className="btn-secondary flex-1" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="app-panel sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="brand-mark h-8 w-8">
            <ListChecks size={18} />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Habit Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-secondary" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={handleLogout} className="btn-secondary" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="app-panel fixed inset-x-0 bottom-0 z-20 flex border-t px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-7 pb-24 md:px-10 md:py-10 md:pb-10">
          <Outlet />
        </div>
      </main>

      {/* PWA install prompt */}
      <PwaInstallPrompt />
    </div>
  );
}
