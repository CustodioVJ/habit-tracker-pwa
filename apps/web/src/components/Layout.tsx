import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Tags, BarChart3, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/habits', label: 'Habits', icon: ListChecks, end: false },
  { to: '/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/stats', label: 'Statistics', icon: BarChart3, end: false },
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ListChecks size={18} />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Habit Tracker</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
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
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
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
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
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
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
