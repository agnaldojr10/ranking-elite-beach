'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  MATCH_STATUS_LABELS,
  ROUND_STATUS_LABELS,
  type GroupStandings,
  type KnockoutView,
  type MatchTeamRef,
  type MatchView,
  type Round,
  type RoundResultView,
} from '@reb/contracts';
import type { DrawResult } from '@reb/contracts';
import type { EligiblePlayer } from '@/lib/rounds';
import {
  confirmDrawAction,
  generateKnockoutAction,
  getDrawReportAction,
  getReportAction,
  registerPresentAction,
  revertKnockoutAction,
  saveResultAction,
  simulateDrawAction,
} from '@/app/rodada/actions';

const card = 'rounded-3xl border border-line/70 bg-surface/60 p-5';
const btn = 'rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-ocean-ink transition hover:opacity-90 disabled:opacity-50';
const btnGhost = 'rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition hover:text-ink disabled:opacity-50';

export function RoundConsole({
  round,
  eligible,
  matches,
  standings,
  knockout,
  result,
}: {
  round: Round;
  eligible: EligiblePlayer[];
  matches: MatchView[];
  standings: GroupStandings[];
  knockout: KnockoutView | null;
  result: RoundResultView[];
}) {
  const hasDraw = matches.length > 0;
  const finished = round.status === 'FINISHED';
  const groupsDone = hasDraw && matches.every((m) => m.status !== 'PENDING');
  const knockoutGenerated = !!knockout?.generated;

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center justify-between`}>
        <span className="text-sm text-ink-2">Situação</span>
        <span className="rounded-full bg-bg/50 px-2.5 py-1 text-xs font-medium text-ink">
          {ROUND_STATUS_LABELS[round.status]}
        </span>
      </div>

      {!hasDraw && !finished && (
        <PresentAndDraw round={round} eligible={eligible} />
      )}

      {hasDraw && (
        <GroupsSection
          roundId={round.id}
          matches={matches}
          standings={standings}
          numSets={round.matchFormat.sets}
        />
      )}

      {hasDraw && (
        <ShareText
          title="Duplas sorteadas"
          description="Gera a lista dos grupos e duplas para enviar no grupo do WhatsApp logo após o sorteio."
          buttonLabel="Gerar lista das duplas"
          load={() => getDrawReportAction(round.id)}
        />
      )}

      {groupsDone && !knockoutGenerated && !finished && (
        <GenerateKnockout roundId={round.id} />
      )}

      {knockoutGenerated && knockout && (
        <KnockoutSection roundId={round.id} knockout={knockout} numSets={round.matchFormat.sets} />
      )}

      {finished && result.length > 0 && <ResultSection result={result} />}

      <ShareText
        title="Relatório do dia"
        description="Gera o texto com a colocação e o ranking atualizado para enviar no grupo do WhatsApp."
        buttonLabel="Gerar relatório"
        load={() => getReportAction(round.id)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentes + sorteio
// ---------------------------------------------------------------------------
function PresentAndDraw({ round, eligible }: { round: Round; eligible: EligiblePlayer[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [preview, setPreview] = useState<DrawResult | null>(null);
  const [drawing, setDrawing] = useState(false);

  const registered = round.registrations ?? [];
  const filtered = useMemo(
    () => eligible.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [eligible, query],
  );
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addPresent = () => {
    setMsg(null);
    start(async () => {
      const res = await registerPresentAction(round.id, [...selected]);
      if (res.error) setMsg(res.error);
      else {
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  const simulate = () => {
    setMsg(null);
    setDrawing(true);
    start(async () => {
      const res = await simulateDrawAction(round.id);
      setDrawing(false);
      if (res.error) setMsg(res.error);
      else setPreview(res.result ?? null);
    });
  };

  const confirm = () => {
    if (!preview) return;
    start(async () => {
      const res = await confirmDrawAction(round.id, preview.seed);
      if (res.error) setMsg(res.error);
      else {
        setPreview(null);
        router.refresh();
      }
    });
  };

  return (
    <section className={card}>
      <h2 className="font-bold text-ink">Presentes ({registered.length})</h2>
      <p className="mt-1 text-sm text-ink-2">
        Marque quem chegou. {round.readiness.canDraw ? 'Pronto para sortear.' : round.readiness.message}
      </p>

      {eligible.length > 0 && (
        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atleta…"
            className="mb-2 w-full rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm text-ink outline-none focus:border-ocean"
          />
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filtered.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-bg/40">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  <span className="text-ink">{p.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <button className={`${btn} mt-3`} disabled={pending || selected.size === 0} onClick={addPresent}>
            {pending ? 'Salvando…' : `Marcar presentes (${selected.size})`}
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-line/60 pt-4">
        {!preview ? (
          <button
            className={btn}
            disabled={pending || drawing || !round.readiness.canDraw}
            onClick={simulate}
          >
            {drawing ? 'Sorteando…' : 'Sortear duplas'}
          </button>
        ) : (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Prévia do sorteio</p>
            <DrawPreview draw={preview} />
            <div className="mt-3 flex gap-2">
              <button className={btn} disabled={pending} onClick={confirm}>
                Confirmar sorteio
              </button>
              <button className={btnGhost} disabled={pending || drawing} onClick={simulate}>
                Sortear de novo
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}
    </section>
  );
}

function DrawPreview({ draw }: { draw: DrawResult }) {
  const nameOf = new Map(draw.teams.map((t) => [t.id, t.playerNames.filter(Boolean).join(' & ')]));
  return (
    <div className="space-y-3">
      {draw.groups.map((g) => (
        <div key={g.name} className="rounded-2xl bg-bg/40 p-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted">Grupo {g.name}</p>
          <ul className="space-y-0.5 text-sm text-ink">
            {g.teamIds.map((id) => (
              <li key={id}>{nameOf.get(id) ?? '—'}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grupos + placares
// ---------------------------------------------------------------------------
function GroupsSection({
  roundId,
  matches,
  standings,
  numSets,
}: {
  roundId: string;
  matches: MatchView[];
  standings: GroupStandings[];
  numSets: number;
}) {
  const groupNames = [...new Set(matches.map((m) => m.groupName))].sort();
  return (
    <section className={card}>
      <h2 className="mb-3 font-bold text-ink">Fase de grupos</h2>
      <div className="space-y-5">
        {groupNames.map((name) => {
          const st = standings.find((s) => s.groupName === name);
          return (
            <div key={name}>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Grupo {name}</p>
              {st && st.standings.length > 0 && (
                <ul className="mb-3 space-y-1 text-sm">
                  {st.standings.map((s) => (
                    <li key={s.teamId} className="flex justify-between text-ink-2">
                      <span>
                        <span className="text-ink">{s.position}.</span> {s.playerNames.join(' & ')}
                      </span>
                      <span className="tabular-nums">
                        {s.wins}V · {s.gamesBalance > 0 ? `+${s.gamesBalance}` : s.gamesBalance}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-3">
                {matches
                  .filter((m) => m.groupName === name)
                  .map((m) => (
                    <MatchScore
                      key={m.id}
                      matchId={m.id}
                      roundId={roundId}
                      teamA={m.teamA}
                      teamB={m.teamB}
                      sets={m.sets}
                      status={m.status}
                      numSets={numSets}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Mata-mata
// ---------------------------------------------------------------------------
function KnockoutSection({
  roundId,
  knockout,
  numSets,
}: {
  roundId: string;
  knockout: KnockoutView;
  numSets: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const stages = [...new Set(knockout.matches.map((m) => m.stage))];

  const revert = () => {
    if (
      !confirm(
        'Reverter o mata-mata? A chave e a colocação serão apagadas e a rodada volta para "em andamento" — aí você corrige o placar do grupo e gera de novo. As duplas e o sorteio são mantidos.',
      )
    )
      return;
    setMsg(null);
    start(async () => {
      const res = await revertKnockoutAction(roundId);
      if (res.error) setMsg(res.error);
      else router.refresh();
    });
  };

  return (
    <section className={card}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-ink">Mata-mata</h2>
        <button className={btnGhost} disabled={pending} onClick={revert}>
          {pending ? 'Revertendo…' : 'Reverter mata-mata'}
        </button>
      </div>
      {msg && <p className="mb-2 text-sm text-danger">{msg}</p>}
      <div className="space-y-5">
        {stages.map((stage) => {
          const stageMatches = knockout.matches.filter((m) => m.stage === stage);
          return (
            <div key={stage}>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">
                {stageMatches[0]?.stageLabel ?? stage}
              </p>
              <div className="space-y-3">
                {stageMatches.map((m) => (
                  <MatchScore
                    key={m.id}
                    matchId={m.id}
                    roundId={roundId}
                    teamA={m.teamA}
                    teamB={m.teamB}
                    sets={m.sets}
                    status={m.status}
                    numSets={numSets}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Formulário de placar (grupo ou mata-mata)
// ---------------------------------------------------------------------------
function MatchScore({
  matchId,
  roundId,
  teamA,
  teamB,
  sets,
  status,
  numSets,
}: {
  matchId: string;
  roundId: string;
  teamA: MatchTeamRef | null;
  teamB: MatchTeamRef | null;
  sets: { a: number; b: number }[] | null;
  status: string;
  numSets: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<{ a: string; b: string }[]>(
    Array.from({ length: numSets }, (_, i) => ({
      a: sets?.[i]?.a?.toString() ?? '',
      b: sets?.[i]?.b?.toString() ?? '',
    })),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!teamA || !teamB) {
    return (
      <div className="rounded-2xl bg-bg/30 px-3 py-2 text-sm text-muted">
        {teamA?.playerNames.join(' & ') ?? 'A definir'} <span className="text-muted">×</span>{' '}
        {teamB?.playerNames.join(' & ') ?? 'A definir'}
      </div>
    );
  }

  const played = status !== 'PENDING';
  const setRow = (i: number, side: 'a' | 'b', v: string) =>
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, [side]: v } : r)));

  const save = () => {
    setMsg(null);
    const parsed = rows
      .filter((r) => r.a !== '' || r.b !== '')
      .map((r) => ({ a: Number(r.a), b: Number(r.b) }));
    if (parsed.length === 0) {
      setMsg('Informe o placar.');
      return;
    }
    start(async () => {
      const res = await saveResultAction(matchId, roundId, { sets: parsed });
      if (res.error) setMsg(res.error);
      else router.refresh();
    });
  };

  const cell = 'w-11 rounded-lg border border-line bg-bg/40 px-1.5 py-1 text-center text-sm text-ink outline-none focus:border-ocean';

  return (
    <div className="rounded-2xl bg-bg/30 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-ink">{teamA.playerNames.join(' & ')}</span>
        <span className="text-muted">×</span>
        <span className="text-ink">{teamB.playerNames.join(' & ')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {rows.map((r, i) => (
          <span key={i} className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={99}
              value={r.a}
              onChange={(e) => setRow(i, 'a', e.target.value)}
              className={cell}
              aria-label={`Set ${i + 1} — ${teamA.playerNames.join(' & ')}`}
            />
            <span className="text-muted">-</span>
            <input
              type="number"
              min={0}
              max={99}
              value={r.b}
              onChange={(e) => setRow(i, 'b', e.target.value)}
              className={cell}
              aria-label={`Set ${i + 1} — ${teamB.playerNames.join(' & ')}`}
            />
          </span>
        ))}
        <button className={btn} disabled={pending} onClick={save}>
          {pending ? '…' : played ? 'Corrigir' : 'Salvar'}
        </button>
        <span className="text-xs text-muted">
          {played ? '' : MATCH_STATUS_LABELS[status as keyof typeof MATCH_STATUS_LABELS] ?? ''}
        </span>
      </div>
      {msg && <p className="mt-2 text-xs text-danger">{msg}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gerar mata-mata
// ---------------------------------------------------------------------------
function GenerateKnockout({ roundId }: { roundId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = () => {
    setMsg(null);
    start(async () => {
      const res = await generateKnockoutAction(roundId);
      if (res.error) setMsg(res.error);
      else router.refresh();
    });
  };
  return (
    <section className={card}>
      <h2 className="font-bold text-ink">Fase de grupos concluída</h2>
      <p className="mt-1 text-sm text-ink-2">Gere o mata-mata para seguir com as finais.</p>
      <button className={`${btn} mt-3`} disabled={pending} onClick={run}>
        {pending ? 'Gerando…' : 'Gerar mata-mata'}
      </button>
      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Resultado final
// ---------------------------------------------------------------------------
function ResultSection({ result }: { result: RoundResultView[] }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <section className={card}>
      <h2 className="mb-3 font-bold text-ink">Resultado da rodada</h2>
      <ol className="space-y-1.5 text-sm">
        {result.map((r) => (
          <li key={r.teamId} className="flex justify-between">
            <span className="text-ink">
              {medals[r.finalPosition - 1] ?? `${r.finalPosition}º`} {r.playerNames.join(' & ')}
            </span>
            <span className="tabular-nums text-ink-2">{r.pointsAwarded} pts</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compartilhar texto no WhatsApp (relatório do dia OU duplas sorteadas)
// ---------------------------------------------------------------------------
function ShareText({
  title,
  description,
  buttonLabel,
  load,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  load: () => Promise<{ text?: string; error?: string }>;
}) {
  const [text, setText] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const run = () => {
    setMsg(null);
    start(async () => {
      const res = await load();
      if (res.error) setMsg(res.error);
      else setText(res.text ?? '');
    });
  };

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMsg('Não foi possível copiar.');
    }
  };

  const waHref = text ? `https://wa.me/?text=${encodeURIComponent(text)}` : '#';

  return (
    <section className={card}>
      <h2 className="font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{description}</p>
      {!text ? (
        <button className={`${btn} mt-3`} disabled={pending} onClick={run}>
          {pending ? 'Gerando…' : buttonLabel}
        </button>
      ) : (
        <div className="mt-3">
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-bg/40 p-3 text-sm text-ink">
            {text}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className={btn} href={waHref} target="_blank" rel="noopener noreferrer">
              Enviar no WhatsApp
            </a>
            <button className={btnGhost} onClick={copy}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button className={btnGhost} onClick={run} disabled={pending}>
              Atualizar
            </button>
          </div>
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}
    </section>
  );
}
