'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { scheduleMatchAction, type FormState } from '@/app/rounds/actions';

type VenueOpt = { id: string; name: string };

/** Converte ISO em valor de input datetime-local (hora local). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-xl border border-line bg-surface-2 px-2 py-1 text-xs text-ink hover:bg-surface-2 disabled:opacity-60"
    >
      {pending ? '…' : 'Salvar'}
    </button>
  );
}

export function ScheduleMatchForm({
  matchId,
  roundId,
  venues,
  currentVenueId,
  currentScheduledAt,
}: {
  matchId: string;
  roundId: string;
  venues: VenueOpt[];
  currentVenueId: string | null;
  currentScheduledAt: string | null;
}) {
  const action = scheduleMatchAction.bind(null, matchId, roundId);
  const [state, formAction] = useFormState(action, {} as FormState);
  const field = 'rounded-xl border border-line bg-surface-2 px-2 py-1 text-xs text-ink';

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select name="venueId" defaultValue={currentVenueId ?? ''} className={field}>
        <option value="">Sem quadra</option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        name="scheduledAt"
        defaultValue={toLocalInput(currentScheduledAt)}
        className={field}
      />
      <Submit />
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
