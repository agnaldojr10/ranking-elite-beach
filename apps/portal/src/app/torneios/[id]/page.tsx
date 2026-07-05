import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CHAMPIONSHIP_STATUS_LABELS,
  ROUND_STATUS_LABELS,
  type MeTournamentRound,
} from '@reb/contracts';
import { Shell } from '@/components/ui/Shell';
import { StandingsMini } from '@/components/ui/StandingsMini';
import { getMyTournament } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function TorneioDetalhePage({ params }: { params: { id: string } }) {
  const t = await getMyTournament(params.id);
  if (!t) notFound();

  return (
    <Shell>
      <Link href="/torneios" className="text-sm text-ocean">
        ‹ Torneios
      </Link>
      <header className="mb-5 mt-2">
        <h1 className="text-2xl font-bold text-ink">{t.name}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {CHAMPIONSHIP_STATUS_LABELS[t.status]}
          {t.position ? ` · ${t.position}º de ${t.total}` : ''}
        </p>
      </header>

      <div className="space-y-4">
        {t.rounds.map((r) => (
          <RoundCard key={r.roundId} r={r} />
        ))}
      </div>
    </Shell>
  );
}

function RoundCard({ r }: { r: MeTournamentRound }) {
  return (
    <section className="rounded-3xl border border-line/70 bg-surface/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">{r.label}</h2>
        <span className="rounded-full bg-bg/50 px-2.5 py-1 text-[11px] text-ink-2">
          {ROUND_STATUS_LABELS[r.status]}
        </span>
      </div>

      {r.myResult ? (
        <p className="mt-2 text-sm text-ink-2">
          Colocação: <span className="font-semibold text-gold">{r.myResult.finalPosition}º</span> ·{' '}
          {r.myResult.pointsAwarded} pts
        </p>
      ) : null}

      {r.myGroup ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">
            Grupo {r.myGroup.groupName}
          </p>
          <StandingsMini group={r.myGroup} myTeamId={r.myTeamId} />
        </div>
      ) : null}

      {r.myKnockout.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Mata-mata</p>
          <div className="space-y-2">
            {r.myKnockout.map((m) => {
              const a = m.teamA?.playerNames.filter(Boolean).join(' & ') ?? 'A definir';
              const b = m.teamB?.playerNames.filter(Boolean).join(' & ') ?? 'A definir';
              const score = m.sets?.map((s) => `${s.a}-${s.b}`).join(' ') ?? '';
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl bg-bg/40 px-3 py-2 text-sm"
                >
                  <span className="text-ink-2">{m.stageLabel}</span>
                  <span className="text-right text-ink">
                    {a} <span className="text-muted">×</span> {b}
                    {score ? <span className="tabular ml-2 text-ink-2">{score}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!r.myGroup && r.myKnockout.length === 0 && !r.myResult ? (
        <p className="mt-2 text-sm text-muted">Sem dados desta rodada ainda.</p>
      ) : null}
    </section>
  );
}
