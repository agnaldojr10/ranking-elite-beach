'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  PLAYER_STATUS_LABELS,
  PlayerStatusSchema,
  SKILL_LEVEL_LABELS,
  SkillLevelSchema,
} from '@reb/contracts';
import type { FormState } from '@/app/players/actions';

type Defaults = {
  name?: string;
  photoUrl?: string | null;
  birthDate?: string;
  phone?: string | null;
  skillLevel?: string;
  status?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-ocean px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : label}
    </button>
  );
}

export function PlayerForm({
  action,
  defaults = {},
  submitLabel = 'Salvar',
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);

  const field = 'rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-ocean';

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nome*
        <input name="name" required defaultValue={defaults.name} className={field} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Data de nascimento*
          <input
            type="date"
            name="birthDate"
            required
            defaultValue={defaults.birthDate}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Telefone
          <input name="phone" defaultValue={defaults.phone ?? ''} className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Foto (URL)
        <input
          name="photoUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaults.photoUrl ?? ''}
          className={field}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nível técnico
          <select name="skillLevel" defaultValue={defaults.skillLevel ?? 'INTERMEDIATE'} className={field}>
            {SkillLevelSchema.options.map((lvl) => (
              <option key={lvl} value={lvl}>
                {SKILL_LEVEL_LABELS[lvl]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={defaults.status ?? 'ACTIVE'} className={field}>
            {PlayerStatusSchema.options.map((st) => (
              <option key={st} value={st}>
                {PLAYER_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href="/players" className="text-sm text-slate-500 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
