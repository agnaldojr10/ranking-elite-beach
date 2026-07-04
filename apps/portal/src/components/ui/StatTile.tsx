import type { ReactNode } from 'react';

/** Cartão de número (KPI) do atleta. */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'ocean' | 'coral' | 'gold';
}) {
  const valueColor =
    accent === 'ocean'
      ? 'text-ocean'
      : accent === 'coral'
        ? 'text-coral'
        : accent === 'gold'
          ? 'text-gold'
          : 'text-ink';
  return (
    <div className="rounded-3xl border border-line/70 bg-surface/60 p-4 backdrop-blur-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular ${valueColor}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-ink-2">{hint}</div> : null}
    </div>
  );
}
