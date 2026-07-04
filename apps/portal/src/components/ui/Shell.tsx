import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

/** Casca imersiva do portal: conteúdo centrado + navegação inferior fixa. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
