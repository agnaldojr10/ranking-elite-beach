import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { IconWhistle } from './icons';

export type Crumb = { label: string; href?: string };

/**
 * Casca comum das telas internas: top bar translúcida fixa (marca + trilha +
 * tema + ações) e conteúdo centrado. Mobile-first.
 */
export function AppShell({
  crumbs,
  actions,
  children,
}: {
  crumbs: Crumb[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-ocean">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ocean text-ocean-ink">
              <IconWhistle width={18} height={18} />
            </span>
            <span className="hidden sm:inline">Elite Beach</span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-ink-2">
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1.5">
                <span className="text-muted">/</span>
                {c.href ? (
                  <Link href={c.href} className="truncate hover:text-ocean">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-ink">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
