'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveClassificationAction } from '@/app/rounds/actions';
import { Tile } from '@/components/ui/Tile';
import { Button } from '@/components/ui/Button';

type Player = { id: string; name: string };
const PODIUM_LABELS = ['Campeão', 'Vice', '3º lugar', '4º lugar'];
const field =
  'h-10 rounded-2xl border border-line bg-surface-2 px-3 text-ink outline-none focus:border-ocean';

export function ClassificationForm({
  roundId,
  championshipId,
  players,
}: {
  roundId: string;
  championshipId: string;
  players: Player[];
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const [waitlist, setWaitlist] = useState<Set<string>>(new Set());
  const [podium, setPodium] = useState<[string, string][]>([
    ['', ''],
    ['', ''],
    ['', ''],
    ['', ''],
  ]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameById = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);
  const filtered = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [players, q],
  );
  const participantList = useMemo(
    () => [...participants].map((id) => ({ id, name: nameById.get(id) ?? '?' })),
    [participants, nameById],
  );
  const podiumPicked = useMemo(() => new Set(podium.flat().filter(Boolean)), [podium]);

  function toggleParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // remove do pódio se sair
        setPodium((p) => p.map(([a, b]) => [a === id ? '' : a, b === id ? '' : b]) as [string, string][]);
      } else {
        next.add(id);
        setWaitlist((w) => {
          const nw = new Set(w);
          nw.delete(id);
          return nw;
        });
      }
      return next;
    });
  }

  function toggleWaitlist(id: string) {
    setWaitlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setParticipants((pp) => {
          const np = new Set(pp);
          np.delete(id);
          return np;
        });
      }
      return next;
    });
  }

  function setPodiumSlot(row: number, col: 0 | 1, value: string) {
    setPodium((prev) => {
      const next = prev.map((r) => [...r] as [string, string]);
      next[row]![col] = value;
      return next;
    });
  }

  async function submit() {
    setError(null);
    const podiumPairs = podium
      .filter(([a, b]) => a && b)
      .map(([a, b]) => ({ playerIds: [a, b] as [string, string] }));
    const payload = {
      participantIds: [...participants],
      waitlistIds: [...waitlist],
      podium: podiumPairs,
    };
    if (payload.participantIds.length < 2) {
      setError('Marque ao menos 2 participantes.');
      return;
    }
    setLoading(true);
    const res = await saveClassificationAction(roundId, payload);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.push(`/championships/${championshipId}/ranking`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Participantes */}
      <Tile>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            Participantes{' '}
            <span className="text-sm font-normal text-ink-2">({participants.size} · espera {waitlist.size})</span>
          </h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar jogador…"
            className={`${field} w-48`}
          />
        </div>
        <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
          {filtered.map((p) => {
            const isPart = participants.has(p.id);
            const isWait = waitlist.has(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-line/60 px-3 py-2 text-sm"
              >
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isPart} onChange={() => toggleParticipant(p.id)} />
                  {p.name}
                </label>
                <label className="flex items-center gap-1 text-xs text-ink-2">
                  <input type="checkbox" checked={isWait} onChange={() => toggleWaitlist(p.id)} />
                  espera
                </label>
              </li>
            );
          })}
        </ul>
      </Tile>

      {/* Pódio */}
      <Tile>
        <h2 className="mb-1 font-semibold">Pódio</h2>
        <p className="mb-3 text-sm text-ink-2">
          Escolha as duplas. Os demais participantes recebem os pontos de participação.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PODIUM_LABELS.map((lbl, row) => (
            <div key={lbl} className="rounded-2xl border border-line/60 p-3">
              <div className="mb-2 text-sm font-medium">{lbl}</div>
              <div className="flex gap-2">
                {([0, 1] as const).map((col) => {
                  const current = podium[row]![col];
                  return (
                    <select
                      key={col}
                      value={current}
                      onChange={(e) => setPodiumSlot(row, col, e.target.value)}
                      className={`${field} min-w-0 flex-1`}
                    >
                      <option value="">— jogador —</option>
                      {participantList.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={podiumPicked.has(p.id) && p.id !== current}
                        >
                          {p.name}
                        </option>
                      ))}
                    </select>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Tile>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={loading}>
          {loading ? 'Lançando…' : 'Lançar classificação'}
        </Button>
        <span className="text-xs text-muted">A rodada será finalizada e o ranking atualizado.</span>
      </div>
    </div>
  );
}
