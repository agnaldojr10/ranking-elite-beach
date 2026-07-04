'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? 'E-mail ou senha inválidos');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  const field =
    'h-11 rounded-2xl border border-line bg-surface-2 px-4 text-ink outline-none transition focus:border-ocean';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
        Senha
        <span className="relative flex items-center">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={`${field} w-full pr-16`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 text-xs font-medium text-ocean"
          >
            {show ? 'ocultar' : 'mostrar'}
          </button>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
