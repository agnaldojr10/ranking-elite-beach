'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { DrawResult } from '@reb/contracts';
import {
  confirmDrawAction,
  simulateDrawAction,
  type DrawState,
  type FormState,
} from '@/app/rounds/actions';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-ok/15 text-ok' : score >= 60 ? 'bg-warn/15 text-warn' : 'bg-danger/10 text-danger';
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
      Qualidade: {score}/100
    </span>
  );
}

function Submit({ hasResult }: { hasResult: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Sorteando…' : hasResult ? 'Regenerar (nova seed)' : 'Simular sorteio'}
    </button>
  );
}

export function DrawSimulation({ roundId }: { roundId: string }) {
  const action = simulateDrawAction.bind(null, roundId);
  const [state, formAction] = useFormState(action, {} as DrawState);
  const [randomness, setRandomness] = useState(50);
  const result = state.result;

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-wrap items-end gap-4 rounded-3xl border border-line bg-surface p-4 shadow-tile">
        <label className="flex flex-col gap-1 text-sm">
          Aleatoriedade: <strong>{randomness}%</strong>
          <input
            type="range"
            name="randomness"
            min={0}
            max={100}
            step={10}
            value={randomness}
            onChange={(e) => setRandomness(Number(e.target.value))}
            className="w-56"
          />
          <span className="text-xs text-muted">0 = aleatório · 100 = máximo balanceamento</span>
        </label>
        <Submit hasResult={!!result} />
        {state.error && (
          <p role="alert" className="w-full rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
      </form>

      {result && <DrawView result={result} roundId={roundId} randomness={randomness} />}
    </div>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-ocean-ink hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Confirmando…' : 'Confirmar este sorteio'}
    </button>
  );
}

function DrawView({
  result,
  roundId,
  randomness,
}: {
  result: DrawResult;
  roundId: string;
  randomness: number;
}) {
  const teamName = new Map(result.teams.map((t) => [t.id, t]));
  const confirm = confirmDrawAction.bind(null, roundId);
  const [confirmState, confirmAction] = useFormState(confirm, {} as FormState);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <ScoreBadge score={result.qualityScore} />
        <span className="text-sm text-ink-2">
          {result.format.groupCount} grupo(s) ({result.format.groups.join(', ')}) ·{' '}
          {result.format.bracketLabel} · seed <code className="text-xs">{result.seed}</code>
        </span>
        <form action={confirmAction}>
          <input type="hidden" name="seed" value={result.seed} />
          <input type="hidden" name="randomness" value={randomness} />
          <ConfirmButton />
        </form>
      </div>
      {confirmState.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {confirmState.error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Parceiros repetidos" value={result.metrics.repeatedPartners} />
        <Metric label="Adversários repetidos" value={result.metrics.repeatedOpponents} />
        <Metric label="Diversidade de duplas" value={`${result.metrics.partnerDiversity}%`} />
        <Metric label="Equilíbrio de grupos" value={result.metrics.groupBalance} hint="menor = melhor" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Duplas (${result.teams.length})`}>
          <ul className="space-y-1 text-sm">
            {result.teams.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-line py-1">
                <span>
                  <strong>{t.label}:</strong> {t.playerNames[0]} + {t.playerNames[1]}
                </span>
                <span className="text-xs text-muted">força {t.strength}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Grupos e confrontos">
          <div className="space-y-3">
            {result.groups.map((g) => (
              <div key={g.name}>
                <p className="font-medium">Grupo {g.name}</p>
                <ul className="ml-2 text-sm text-ink-2">
                  {g.teamIds.map((id) => (
                    <li key={id}>
                      {teamName.get(id)?.playerNames.join(' + ')}
                    </li>
                  ))}
                </ul>
                <ul className="ml-2 mt-1 text-xs text-ink-2">
                  {result.matches
                    .filter((m) => m.groupName === g.name)
                    .map((m, i) => (
                      <li key={i}>
                        {teamName.get(m.teamAId)?.label} × {teamName.get(m.teamBId)?.label}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Por que este sorteio?">
        <ul className="list-inside list-disc space-y-1 text-sm text-ink">
          {result.explanations.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </Panel>

      <p className="text-xs text-muted">
        Simulação não persiste nada (BR-19). "Confirmar sorteio" (gravar duplas/grupos/jogos e
        atualizar histórico) entra na próxima fatia da Sprint 5.
      </p>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
