'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { MatchView } from '@reb/contracts';
import { registerMatchResultAction, type FormState } from '@/app/rounds/actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-full bg-ocean px-4 py-2 text-sm font-medium text-ocean-ink transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : label}
    </button>
  );
}

export function MatchResultForm({
  match,
  roundId,
  numSets,
}: {
  match: MatchView;
  roundId: string;
  numSets: number;
}) {
  const action = registerMatchResultAction.bind(null, match.id, roundId);
  const [state, formAction] = useFormState(action, {} as FormState);
  const [walkover, setWalkover] = useState(false);

  const played = match.status !== 'PENDING';
  const cell = 'w-14 rounded-xl border border-line bg-surface-2 px-2 py-1 text-sm text-ink outline-none focus:border-ocean';

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="mode" value={walkover ? 'walkover' : 'sets'} />

      {walkover ? (
        <>
          <select name="winnerTeamId" required defaultValue="" className="rounded-md border border-line px-2 py-1 text-sm">
            <option value="" disabled>
              Vencedor do W.O.…
            </option>
            <option value={match.teamA.id}>{match.teamA.playerNames.join(' + ')}</option>
            <option value={match.teamB.id}>{match.teamB.playerNames.join(' + ')}</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-ink-2">
            <input type="checkbox" name="injury" /> por lesão
          </label>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {Array.from({ length: numSets }).map((_, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                name={`set${i}_a`}
                type="number"
                min={0}
                max={99}
                defaultValue={match.sets?.[i]?.a ?? ''}
                className={cell}
                aria-label={`Set ${i + 1} — ${match.teamA.label}`}
              />
              <span className="text-muted">×</span>
              <input
                name={`set${i}_b`}
                type="number"
                min={0}
                max={99}
                defaultValue={match.sets?.[i]?.b ?? ''}
                className={cell}
                aria-label={`Set ${i + 1} — ${match.teamB.label}`}
              />
            </span>
          ))}
        </div>
      )}

      <Submit label={played ? 'Corrigir' : 'Salvar'} />
      <button
        type="button"
        onClick={() => setWalkover((w) => !w)}
        className="text-xs text-ink-2 hover:underline"
      >
        {walkover ? 'lançar placar' : 'W.O.'}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
