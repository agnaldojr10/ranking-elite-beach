import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  MATCH_STATUS_LABELS,
  roundLabel,
  type KnockoutMatchView,
  type MatchView,
  type RoundResultView,
} from '@reb/contracts';
import { MatchResultForm } from '@/components/MatchResultForm';
import { RevertKnockoutButton } from '@/components/RevertKnockoutButton';
import { getKnockout, getRound, getRoundMatches, getRoundResult } from '@/lib/rounds';
import { generateKnockoutAction } from '../../actions';

const STAGE_ORDER = ['R32', 'R16', 'QF', 'SF', 'F', '3P'];

export default async function RoundKnockoutPage({ params }: { params: { id: string } }) {
  const round = await getRound(params.id);
  if (!round) notFound();
  if (round.status !== 'IN_PROGRESS' && round.status !== 'FINISHED') {
    redirect(`/rounds/${round.id}`);
  }

  const [knockout, groupMatches, result] = await Promise.all([
    getKnockout(round.id),
    getRoundMatches(round.id),
    getRoundResult(round.id),
  ]);

  const groupStageComplete =
    groupMatches.length > 0 && groupMatches.every((m) => m.status !== 'PENDING');
  const generated = knockout?.generated ?? false;
  const numSets = round.matchFormat.sets;
  const generate = generateKnockoutAction.bind(null, round.id);

  const stages = [...new Set((knockout?.matches ?? []).map((m) => m.stage))].sort(
    (a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b),
  );

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-muted">/</span>
        <Link href={`/rounds/${round.id}`} className="font-medium text-ocean">
          {roundLabel(round)}
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Mata-mata</span>
      </header>

      <section className="space-y-8 p-6">
        {result.length > 0 && <FinalPlacement result={result} />}

        {!generated ? (
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-tile">
            {groupStageComplete ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-ink-2">
                  Fase de grupos concluída. Gere o mata-mata para cruzar os classificados conforme o
                  formato da rodada.
                </p>
                <form action={generate}>
                  <button className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90">
                    Gerar mata-mata
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-ink-2">
                Conclua todos os jogos da fase de grupos em{' '}
                <Link href={`/rounds/${round.id}/results`} className="text-ocean hover:underline">
                  Resultados
                </Link>{' '}
                para liberar o mata-mata.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-4 shadow-tile">
              <p className="text-sm text-ink-2">
                Lançou um placar de grupo errado e o mata-mata saiu incorreto? Reverta, corrija o
                resultado em Resultados e gere o mata-mata de novo.
              </p>
              <RevertKnockoutButton roundId={round.id} />
            </div>
            {stages.map((stage) => (
              <StageBlock
                key={stage}
                stage={stage}
                matches={(knockout?.matches ?? []).filter((m) => m.stage === stage)}
                roundId={round.id}
                numSets={numSets}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function FinalPlacement({ result }: { result: RoundResultView[] }) {
  return (
    <div className="rounded-lg border border-ok/40 bg-ok/10 p-4">
      <h2 className="mb-3 text-lg font-semibold">Colocação final da rodada</h2>
      <div className="overflow-hidden rounded-md border border-ok/30 bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-ink-2">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Dupla</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {result.map((r) => (
              <tr key={r.teamId} className="border-t border-line">
                <td className="px-3 py-2 font-medium">{r.finalPosition}º</td>
                <td className="px-3 py-2">{r.playerNames.join(' + ')}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.pointsAwarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageBlock({
  stage,
  matches,
  roundId,
  numSets,
}: {
  stage: string;
  matches: KnockoutMatchView[];
  roundId: string;
  numSets: number;
}) {
  const label = matches[0]?.stageLabel ?? stage;
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
      <h2 className="mb-3 text-lg font-semibold">{label}</h2>
      <div className="space-y-3">
        {matches.map((m) => {
          const decided = m.status !== 'PENDING';
          const playable = !decided && m.teamA && m.teamB;
          return (
            <div
              key={m.id}
              className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 md:flex-row md:items-center md:justify-between"
            >
              <div className="text-sm">
                <span className={m.winnerTeamId === m.teamA?.id ? 'font-semibold' : ''}>
                  {m.teamA ? m.teamA.playerNames.join(' + ') : 'A definir'}
                </span>
                <span className="text-muted"> × </span>
                <span className={m.winnerTeamId === m.teamB?.id ? 'font-semibold' : ''}>
                  {m.teamB ? m.teamB.playerNames.join(' + ') : 'A definir'}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {m.sets && m.sets.length > 0
                    ? m.sets.map((s) => `${s.a}-${s.b}`).join(', ')
                    : MATCH_STATUS_LABELS[m.status]}
                </span>
              </div>
              {playable && (
                <MatchResultForm match={toMatchView(m)} roundId={roundId} numSets={numSets} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toMatchView(m: KnockoutMatchView): MatchView {
  return {
    id: m.id,
    groupName: m.stageLabel,
    teamA: m.teamA!,
    teamB: m.teamB!,
    sets: m.sets,
    winnerTeamId: m.winnerTeamId,
    status: m.status,
    isWalkover: false,
    walkoverInjury: false,
    venueId: m.venueId,
    venueName: m.venueName,
    scheduledAt: m.scheduledAt,
  };
}
