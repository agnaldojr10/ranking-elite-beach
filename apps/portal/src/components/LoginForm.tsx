'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'E-mail ou senha inválidos');
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-2">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12 w-full rounded-2xl border border-line bg-bg/50 px-4 text-ink outline-none focus:border-ocean"
          placeholder="voce@email.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-2">Senha</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-12 w-full rounded-2xl border border-line bg-bg/50 px-4 pr-16 text-ink outline-none focus:border-ocean"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-3 my-auto text-xs font-medium text-muted hover:text-ink-2"
          >
            {show ? 'ocultar' : 'ver'}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-ocean font-semibold text-ocean-ink shadow-ocean-glow transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="pt-2 text-center text-sm text-ink-2">
        Primeiro acesso?{' '}
        <Link href="/claim" className="font-semibold text-ocean">
          Ativar conta com convite
        </Link>
      </p>
    </form>
  );
}
