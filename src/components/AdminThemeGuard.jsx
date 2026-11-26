import { useState, useLayoutEffect, useEffect, useRef } from 'react';

// Admin area follows its own appearance preference (default: light "Apple" look).
// It never changes the storefront theme: the global .dark class is restored on exit.
const KEY = 'elz_admin_theme';
const readPref = () => {
  try { return window.localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
};

export function AdminThemeGuard() {
  const [mode, setMode] = useState(readPref);
  const prevDark = useRef(null);
  useLayoutEffect(() => {
    const el = document.documentElement;
    if (prevDark.current === null) prevDark.current = el.classList.contains('dark');
    el.classList.toggle('dark', mode === 'dark');
  }, [mode]);
  useLayoutEffect(() => () => {
    if (prevDark.current !== null) document.documentElement.classList.toggle('dark', prevDark.current);
  }, []);
  useEffect(() => {
    const h = () => setMode(readPref());
    window.addEventListener('elz-admin-theme', h);
    return () => window.removeEventListener('elz-admin-theme', h);
  }, []);
  return null;
}

export function AdminThemeToggle() {
  const [mode, setMode] = useState(readPref);
  useEffect(() => {
    const h = () => setMode(readPref());
    window.addEventListener('elz-admin-theme', h);
    return () => window.removeEventListener('elz-admin-theme', h);
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        try { window.localStorage.setItem(KEY, mode === 'dark' ? 'light' : 'dark'); } catch (e) {}
        window.dispatchEvent(new Event('elz-admin-theme'));
      }}
      className="w-9 h-9 rounded-xl flex items-center justify-center border border-line bg-surface2 hover:border-[#0071E3] transition"
      title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}
    >
      <span>{mode === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  );
}
