'use client';

import { useEffect, useState } from 'react';

function parts(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

/** Contagem regressiva até o horário do próximo jogo. */
export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Evita mismatch de hidratação: só renderiza os números no cliente.
  if (now === null) {
    return <div className="h-9" aria-hidden />;
  }

  const left = targetMs - now;
  if (left <= 0) {
    return <span className="text-sm font-semibold text-coral">Começando agora</span>;
  }

  const { d, h, m, s } = parts(left);
  const cell = (v: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="tabular text-2xl font-bold leading-none text-ink">
        {String(v).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex items-start gap-3">
      {d > 0 ? cell(d, 'dias') : null}
      {cell(h, 'h')}
      {cell(m, 'min')}
      {cell(s, 'seg')}
    </div>
  );
}
