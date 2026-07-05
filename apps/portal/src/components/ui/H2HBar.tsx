/** Barra de retrospecto: vitórias (oceano) × derrotas (coral). */
export function H2HBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  const winPct = total ? (wins / total) * 100 : 50;
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="tabular text-3xl font-bold text-ocean">{wins}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">vitórias</div>
        </div>
        <div className="text-right">
          <div className="tabular text-3xl font-bold text-coral">{losses}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted">derrotas</div>
        </div>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-ocean" style={{ width: `${winPct}%` }} aria-hidden />
        <div className="bg-coral" style={{ width: `${100 - winPct}%` }} aria-hidden />
      </div>
      {total === 0 ? (
        <p className="mt-2 text-center text-sm text-muted">Sem confrontos registrados ainda.</p>
      ) : null}
    </div>
  );
}
