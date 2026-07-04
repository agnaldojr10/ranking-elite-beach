'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import type { Season } from '@reb/contracts';
import type { FormState } from '@/app/championships/actions';

type Defaults = {
  seasonId?: string;
  name?: string;
  roundsCount?: number;
  qualifiersCount?: number;
  startDate?: string | null;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-ocean px-4 py-2 font-medium text-ocean-ink hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : label}
    </button>
  );
}

export function ChampionshipForm({
  action,
  seasons,
  defaults = {},
  submitLabel = 'Salvar',
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  seasons?: Season[];
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const field = 'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-ink outline-none focus:border-ocean';

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {seasons && (
        <label className="flex flex-col gap-1 text-sm">
          Temporada*
          <select name="seasonId" required defaultValue={defaults.seasonId ?? ''} className={field}>
            <option value="" disabled>
              Selecione…
            </option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year} — {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Nome*
        <input name="name" required defaultValue={defaults.name} className={field} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nº de rodadas*
          <input
            name="roundsCount"
            type="number"
            min={1}
            max={52}
            required
            defaultValue={defaults.roundsCount ?? 10}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nº de classificados (final)*
          <input
            name="qualifiersCount"
            type="number"
            min={2}
            max={64}
            required
            defaultValue={defaults.qualifiersCount ?? 8}
            className={field}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Data de início
        <input
          type="date"
          name="startDate"
          defaultValue={defaults.startDate ?? ''}
          className={field}
        />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Submit label={submitLabel} />
        <Link href="/championships" className="text-sm text-ink-2 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
