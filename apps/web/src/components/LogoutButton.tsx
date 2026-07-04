'use client';

import { useRouter } from 'next/navigation';
import { IconLogout } from '@/components/ui/icons';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      aria-label="Sair"
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ink-2 transition hover:bg-surface-2"
    >
      <IconLogout width={18} height={18} />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
