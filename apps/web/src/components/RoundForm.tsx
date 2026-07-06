'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { ROUND_KIND_LABELS, RoundKindSchema } from '@reb/contracts';
import type { FormState } from '@/app/rounds/actions';

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

export type RoundFormDefaults = {
  number: number;
  date: string;
  groupSizePref: number;
  sets: 1 | 3;
  gamesPerSet: number;
  matchTieBreak: boolean;
};

export function RoundForm({
  action,
  championshipId,
  suggestedNumber,
  submitLabel = 'Criar rodada',
  defaults,
  showKind = true,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  championshipId: string;
  suggestedNumber: number;
  submitLabel?: string;
  /** Preenche o formulário para edição. */
  defaults?: RoundFormDefaults;
  /** Oculta o campo "Tipo" (a edição não altera o tipo da rodada). */
  showKind?: boolean;
  /** Destino do "Cancelar" (padrão: página do campeonato). */
  cancelHref?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const field = 'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-ink outline-none focus:border-ocean';
  const back = cancelHref ?? `/championships/${championshipId}`;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nº da rodada
          <input
            name="number"
            type="number"
            min={1}
            max={999}
            defaultValue={defaults?.number ?? suggestedNumber}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Data
          <input type="date" name="date" defaultValue={defaults?.date ?? ''} className={field} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {showKind && (
          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select name="kind" defaultValue="REGULAR" className={field}>
              {RoundKindSchema.options.map((k) => (
                <option key={k} value={k}>
                  {ROUND_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Preferência de grupo
          <select name="groupSizePref" defaultValue={String(defaults?.groupSizePref ?? 3)} className={field}>
            <option value="3">Grupos de 3 (padrão)</option>
            <option value="4">Grupos de 4 (mais jogos)</option>
          </select>
        </label>
      </div>

      <fieldset className="rounded-md border border-line p-4">
        <legend className="px-1 text-sm font-medium text-ink-2">Formato de partida</legend>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Sets
            <select name="sets" defaultValue={String(defaults?.sets ?? 1)} className={field}>
              <option value="1">1 set (padrão)</option>
              <option value="3">Melhor de 3 sets</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Games por set
            <input
              name="gamesPerSet"
              type="number"
              min={1}
              max={9}
              defaultValue={defaults?.gamesPerSet ?? 6}
              className={field}
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="matchTieBreak" defaultChecked={defaults?.matchTieBreak ?? false} />
          Usar match tie-break no set decisivo
        </label>
      </fieldset>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Submit label={submitLabel} />
        <Link href={back} className="text-sm text-ink-2 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
