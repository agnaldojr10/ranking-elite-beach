'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  PLAYER_STATUS_LABELS,
  PLAYER_TYPE_LABELS,
  PlayerStatusSchema,
  PlayerTypeSchema,
  SKILL_LEVEL_LABELS,
  SkillLevelSchema,
} from '@reb/contracts';
import type { FormState } from '@/app/players/actions';
import { buttonClass } from '@/components/ui/Button';

type Defaults = {
  name?: string;
  photoUrl?: string | null;
  birthDate?: string;
  phone?: string | null;
  skillLevel?: string;
  status?: string;
  type?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
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

  const field =
    'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-ink outline-none focus:border-ocean';

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

      <label className="flex flex-col gap-1 text-sm">
        Tipo no ranking
        <select name="type" defaultValue={defaults.type ?? 'REGULAR'} className={field}>
          {PlayerTypeSchema.options.map((t) => (
            <option key={t} value={t}>
              {PLAYER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">
          &quot;Convidado&quot; joga para completar o chaveamento, mas não pontua nem aparece no
          ranking (ex.: professor). Não afeta os pontos do parceiro.
        </span>
      </label>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href="/players" className="text-sm text-ink-2 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
