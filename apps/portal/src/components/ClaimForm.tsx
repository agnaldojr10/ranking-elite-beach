'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ClaimForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
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
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'Não foi possível ativar sua conta');
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao ativar');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-2">Código do convite</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          autoCapitalize="characters"
          className="h-12 w-full rounded-2xl border border-line bg-bg/50 px-4 font-mono tracking-widest text-ink outline-none focus:border-ocean"
          placeholder="ABCD-EFGH-JKMN"
        />
        <p className="mt-1 text-xs text-muted">Peça o código à organização do seu torneio.</p>
      </div>
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
        <label className="mb-1 block text-sm font-medium text-ink-2">Crie uma senha</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="h-12 w-full rounded-2xl border border-line bg-bg/50 px-4 pr-16 text-ink outline-none focus:border-ocean"
            placeholder="mín. 8 caracteres"
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
        {loading ? 'Ativando…' : 'Ativar minha conta'}
      </button>

      <p className="pt-2 text-center text-sm text-ink-2">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-ocean">
          Entrar
        </Link>
      </p>
    </form>
  );
}
