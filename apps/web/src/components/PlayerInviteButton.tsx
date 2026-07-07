'use client';

import { useState, useTransition } from 'react';
import { generatePlayerInviteAction } from '@/app/players/actions';

const PORTAL_URL = (
  process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://ranking-elite-beach-portal.vercel.app'
).replace(/\/$/, '');

/** Botão que gera o convite de acesso ao portal e mostra o código + WhatsApp. */
export function PlayerInviteButton({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
  const [pending, start] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setError(null);
    setCopied(false);
    start(async () => {
      const res = await generatePlayerInviteAction(playerId);
      if (res.error) {
        setError(res.error);
        setCode(null);
      } else {
        setCode(res.code ?? null);
        setExpiresAt(res.expiresAt ?? null);
      }
    });
  };

  const claimUrl = `${PORTAL_URL}/claim`;
  const waText = code
    ? `🏖️ *Ranking Elite Beach* — seu acesso ao app!\nEntre em ${claimUrl}, toque em "Ativar conta com convite" e use o código: ${code}\nAssim você acompanha o ranking, seus jogos e as rodadas. 🎾`
    : '';
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Não foi possível copiar.');
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={generate}
        disabled={pending}
        className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? 'Gerando…' : code ? 'Gerar outro convite' : 'Gerar convite de acesso'}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      {code && (
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-2 p-3 text-left">
          <p className="text-xs text-ink-2">Código de acesso de {playerName}:</p>
          <p className="mt-1 select-all font-mono text-lg font-bold tracking-wider text-ink">{code}</p>
          {expiresAt && (
            <p className="mt-0.5 text-xs text-muted">
              Válido até {new Date(expiresAt).toLocaleDateString('pt-BR')} · uso único
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ocean px-4 py-1.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
            >
              Enviar no WhatsApp
            </a>
            <button
              onClick={copy}
              className="rounded-full border border-line px-4 py-1.5 text-sm transition hover:bg-surface"
            >
              {copied ? 'Copiado!' : 'Copiar código'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
