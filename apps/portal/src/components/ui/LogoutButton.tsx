'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconLogout } from './icons';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-surface/60 px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-60"
    >
      <IconLogout width={18} height={18} />
      {loading ? 'Saindo…' : 'Sair'}
    </button>
  );
}
