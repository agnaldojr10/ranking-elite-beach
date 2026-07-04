/**
 * Barras horizontais para magnitude (hue único). Server component, sem dependência.
 * Baseline à esquerda, extremidade arredondada, rótulo de valor ao fim.
 */
export function BarChartH({
  data,
  unit = '',
}: {
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 truncate text-ink-2 sm:w-40" title={d.label}>
              {d.label}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-2.5 rounded-full bg-ocean"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
              <span className="tabular-nums font-semibold text-ink">
                {d.value}
                {unit}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
