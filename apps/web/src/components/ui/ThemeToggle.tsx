'use client';

import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from './icons';

/** Alterna tema claro/escuro e persiste em localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-2 transition hover:bg-surface-2"
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
