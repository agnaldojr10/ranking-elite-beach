import type { ReactNode } from 'react';
import { Tile } from './Tile';

export function StatTile({
  label,
  value,
  icon,
  hint,
  span = '',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  span?: string;
}) {
  return (
    <Tile span={span} className="flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-2">{label}</span>
        {icon && <span className="text-ocean">{icon}</span>}
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </Tile>
  );
}
