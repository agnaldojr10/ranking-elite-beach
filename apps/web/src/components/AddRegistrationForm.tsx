'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  REGISTRATION_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  type RegistrationStatus,
  type SkillLevel,
} from '@reb/contracts';
import { createRegistrationsBulkAction } from '@/app/rounds/actions';
import { buttonClass } from '@/components/ui/Button';

type AvailablePlayer = { id: string; name: string; skillLevel: SkillLevel };

const field =
  'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

export function AddRegistrationForm({
  roundId,
  players,
}: {
  roundId: string;
  players: AvailablePlayer[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<RegistrationStatus>('CONFIRMED');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [players, q],
  );

  if (players.length === 0) {
    return (
      <p className="text-sm text-ink-2">Todos os jogadores ativos já estão inscritos nesta rodada.</p>
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)),
    );
  }

  async function submit() {
    setError(null);
    if (selected.size === 0) {
      setError('Selecione ao menos 1 jogador.');
      return;
    }
    setLoading(true);
    const res = await createRegistrationsBulkAction(roundId, {
      playerIds: [...selected],
      status,
    });
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setSelected(new Set());
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jogador…"
          className={`${field} w-56`}
        />
        <button type="button" onClick={toggleAll} className="text-sm font-medium text-ocean">
          {selected.size === filtered.length ? 'Limpar seleção' : 'Selecionar todos'}
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Situação
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
            className={field}
          >
            {(['CONFIRMED', 'PENDING', 'WAITLIST'] as const).map((s) => (
              <option key={s} value={s}>
                {REGISTRATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {filtered.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line/60 px-3 py-2 text-sm hover:bg-surface-2">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
              <span className="flex-1">{p.name}</span>
              <span className="text-xs text-muted">{SKILL_LEVEL_LABELS[p.skillLevel]}</span>
            </label>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button onClick={submit} disabled={loading} className={buttonClass('primary', 'md')}>
        {loading ? 'Inscrevendo…' : `Inscrever selecionados (${selected.size})`}
      </button>
    </div>
  );
}
