'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  REGISTRATION_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  type SkillLevel,
} from '@reb/contracts';
import { createRegistrationAction, type FormState } from '@/app/rounds/actions';
import { buttonClass } from '@/components/ui/Button';

type AvailablePlayer = { id: string; name: string; skillLevel: SkillLevel };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Inscrevendo…' : 'Inscrever'}
    </button>
  );
}

export function AddRegistrationForm({
  roundId,
  players,
}: {
  roundId: string;
  players: AvailablePlayer[];
}) {
  const action = createRegistrationAction.bind(null, roundId);
  const [state, formAction] = useFormState(action, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const field =
    'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

  if (players.length === 0) {
    return (
      <p className="text-sm text-ink-2">
        Todos os jogadores ativos já estão inscritos nesta rodada.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Jogador
        <select name="playerId" required defaultValue="" className={field}>
          <option value="" disabled>
            Selecione…
          </option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {SKILL_LEVEL_LABELS[p.skillLevel]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Situação
        <select name="status" defaultValue="CONFIRMED" className={field}>
          {(['CONFIRMED', 'PENDING', 'WAITLIST'] as const).map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <Submit />
      {state.error && (
        <p role="alert" className="w-full rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
