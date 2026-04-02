import { useEffect, useState } from 'react';

export default function Navbar() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const user = localStorage.getItem('user') || 'Teacher';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-6">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Welcome back, <span className="text-slate-800 dark:text-white font-semibold">{user}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle theme"
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
          {user.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
