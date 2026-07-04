import { IconArrowDown, IconArrowUp } from './icons';

/** Indicador de variação de posição no ranking (▲ subiu, ▼ caiu, — estável). */
export function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0) {
    return <span className="text-xs font-medium text-muted">estável</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-ok' : 'text-danger'}`}
      title={up ? `Subiu ${delta}` : `Caiu ${Math.abs(delta)}`}
    >
      {up ? <IconArrowUp width={14} height={14} /> : <IconArrowDown width={14} height={14} />}
      {Math.abs(delta)}
    </span>
  );
}
