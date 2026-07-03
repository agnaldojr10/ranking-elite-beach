'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  TIEBREAKER_LABELS,
  TiebreakerSchema,
  type ChampionshipConfig,
  type Tiebreaker,
} from '@reb/contracts';
import type { FormState } from '@/app/championships/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-ocean px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : 'Salvar configuração'}
    </button>
  );
}

export function ChampionshipConfigForm({
  action,
  config,
  locked,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  config: ChampionshipConfig;
  locked: boolean;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const field = 'rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-ocean';
  const placements = Object.keys(config.scoringTable)
    .map(Number)
    .sort((a, b) => a - b);
  const tbOptions = TiebreakerSchema.options;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <input type="hidden" name="locked" value={locked ? '1' : '0'} />

      {locked && (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Campeonato ativo: pontuação, desempate e final estão bloqueados (BR-05). Você ainda pode
          ajustar os pesos do sorteio e a aleatoriedade.
        </p>
      )}

      {/* Sorteio — sempre editável */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Motor de sorteio</legend>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(['ranking', 'skill', 'partner', 'opponent'] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 text-sm capitalize">
              Peso {k}
              <input
                name={`w_${k}`}
                type="number"
                step="0.05"
                min={0}
                max={1}
                defaultValue={config.drawWeights[k]}
                className={field}
              />
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Aleatoriedade (0–100)
          <input
            name="randomness"
            type="number"
            min={0}
            max={100}
            defaultValue={config.randomness}
            className={field}
          />
        </label>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="allowRepeatPartners"
              defaultChecked={config.allowRepeatPartners}
            />
            Permitir repetir parceiros
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="allowRepeatOpponents"
              defaultChecked={config.allowRepeatOpponents}
            />
            Permitir repetir adversários
          </label>
        </div>
      </fieldset>

      {/* Pontuação — estrutural */}
      <fieldset className="flex flex-col gap-3" disabled={locked}>
        <legend className="mb-1 font-semibold">Pontuação por colocação</legend>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {placements.map((p) => (
            <label key={p} className="flex flex-col gap-1 text-xs">
              {p}º
              <input
                name={`score_${p}`}
                type="number"
                min={0}
                defaultValue={config.scoringTable[String(p)]}
                className={field}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {/* Desempate — estrutural */}
      <fieldset className="flex flex-col gap-3" disabled={locked}>
        <legend className="mb-1 font-semibold">Critérios de desempate (ordem)</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((slot) => {
            const current: Tiebreaker | '' = config.tiebreakers[slot] ?? '';
            return (
              <label key={slot} className="flex flex-col gap-1 text-sm">
                {slot + 1}º critério
                <select name={`tb_${slot}`} defaultValue={current} className={field}>
                  <option value="">—</option>
                  {tbOptions.map((t) => (
                    <option key={t} value={t}>
                      {TIEBREAKER_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Final — estrutural */}
      <fieldset className="flex flex-col gap-3" disabled={locked}>
        <legend className="mb-1 font-semibold">Fase final</legend>
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          Tamanho preferencial de grupo
          <input
            name="groupSizePreference"
            type="number"
            min={3}
            max={5}
            defaultValue={config.finalConfig.groupSizePreference}
            className={field}
          />
        </label>
      </fieldset>

      {state?.error && (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Submit />
        <Link href="../" className="text-sm text-slate-500 hover:underline">
          Voltar
        </Link>
      </div>
    </form>
  );
}
