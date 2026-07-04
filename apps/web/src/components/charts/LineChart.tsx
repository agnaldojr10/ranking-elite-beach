/**
 * Gráfico de linhas (mudança ao longo do tempo) em SVG inline, sem dependência.
 * Até ~5 séries com paleta categórica validada (dataviz), legenda sempre presente.
 * Server component; responsivo via viewBox.
 */
const PALETTE = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7'];

export type LineSeries = { name: string; values: number[] };

export function LineChart({
  xLabels,
  series,
}: {
  xLabels: string[];
  series: LineSeries[];
}) {
  const shown = series.slice(0, PALETTE.length);
  const W = 640;
  const H = 260;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = xLabels.length;

  const maxY = Math.max(1, ...shown.flatMap((s) => s.values));
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  // 4 linhas de grade horizontais
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => pad.top + innerH - f * innerH);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        role="img"
        aria-label="Evolução de pontos acumulados por rodada"
      >
        {gridY.map((gy, i) => (
          <line
            key={i}
            x1={pad.left}
            y1={gy}
            x2={W - pad.right}
            y2={gy}
            className="stroke-line"
            strokeWidth={1}
          />
        ))}
        {xLabels.map((lbl, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} className="fill-muted">
            R{lbl}
          </text>
        ))}
        <text x={pad.left} y={pad.top - 4} fontSize={11} className="fill-muted">
          {maxY} pts
        </text>

        {shown.map((s, si) => {
          const color = PALETTE[si]!;
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          return (
            <g key={si}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {shown.map((s, si) => (
          <li key={si} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE[si] }} aria-hidden />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
