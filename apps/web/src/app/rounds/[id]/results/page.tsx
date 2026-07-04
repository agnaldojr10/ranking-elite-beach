import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  MATCH_STATUS_LABELS,
  roundLabel,
  type GroupStandings,
  type MatchView,
  type Venue,
} from '@reb/contracts';
import { MatchResultForm } from '@/components/MatchResultForm';
import { ScheduleMatchForm } from '@/components/ScheduleMatchForm';
import { getRound, getRoundMatches, getRoundStandings } from '@/lib/rounds';
import { listVenues } from '@/lib/venues';

export default async function RoundResultsPage({ params }: { params: { id: string } }) {
  const round = await getRound(params.id);
  if (!round) notFound();

  // Só faz sentido após o sorteio confirmado.
  if (round.status !== 'DRAWN' && round.status !== 'IN_PROGRESS' && round.status !== 'FINISHED') {
    redirect(`/rounds/${round.id}`);
  }

  const [matches, standings, venues] = await Promise.all([
    getRoundMatches(round.id),
    getRoundStandings(round.id),
    listVenues(),
  ]);
  const numSets = round.matchFormat.sets;

  const groupNames = [...new Set(matches.map((m) => m.groupName))].sort();

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
        <span className="font-medium">Resultados</span>
      </header>

      <section className="space-y-8 p-6">
        <p className="text-sm text-ink-2">
          Lance o placar de cada jogo ({numSets === 1 ? '1 set' : 'melhor de 3'}). O vencedor é
          derivado do placar; a classificação atualiza automaticamente com os critérios de desempate
          (vitórias → saldo de games → confronto direto).
        </p>

        {groupNames.map((name) => (
          <GroupBlock
            key={name}
            name={name}
            standings={standings.find((s) => s.groupName === name)}
            matches={matches.filter((m) => m.groupName === name)}
            roundId={round.id}
            numSets={numSets}
            venues={venues}
          />
        ))}
      </section>
    </main>
  );
}

function GroupBlock({
  name,
  standings,
  matches,
  roundId,
  numSets,
  venues,
}: {
  name: string;
  standings?: GroupStandings;
  matches: MatchView[];
  roundId: string;
  numSets: number;
  venues: Venue[];
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
      <h2 className="mb-3 text-lg font-semibold">Grupo {name}</h2>

      {standings && standings.standings.length > 0 && (
        <div className="mb-5 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-ink-2">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Dupla</th>
                <th className="px-3 py-2">J</th>
                <th className="px-3 py-2">V</th>
                <th className="px-3 py-2">D</th>
                <th className="px-3 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {standings.standings.map((s) => (
                <tr key={s.teamId} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{s.position}</td>
                  <td className="px-3 py-2">{s.playerNames.join(' + ')}</td>
                  <td className="px-3 py-2">{s.played}</td>
                  <td className="px-3 py-2">{s.wins}</td>
                  <td className="px-3 py-2">{s.losses}</td>
                  <td className="px-3 py-2">
                    {s.gamesBalance > 0 ? `+${s.gamesBalance}` : s.gamesBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="border-b border-line pb-3 last:border-0">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm">
                <span className={m.winnerTeamId === m.teamA.id ? 'font-semibold' : ''}>
                  {m.teamA.playerNames.join(' + ')}
                </span>
                <span className="text-muted"> × </span>
                <span className={m.winnerTeamId === m.teamB.id ? 'font-semibold' : ''}>
                  {m.teamB.playerNames.join(' + ')}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {m.sets && m.sets.length > 0
                    ? m.sets.map((s) => `${s.a}-${s.b}`).join(', ')
                    : MATCH_STATUS_LABELS[m.status]}
                  {m.isWalkover ? ` · W.O.${m.walkoverInjury ? ' (lesão)' : ''}` : ''}
                </span>
              </div>
              <MatchResultForm match={m} roundId={roundId} numSets={numSets} />
            </div>
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-ink-2">
                {m.venueName || m.scheduledAt
                  ? `Quadra/horário: ${m.venueName ?? '—'}${m.scheduledAt ? ` · ${new Date(m.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`
                  : 'Definir quadra/horário'}
              </summary>
              <div className="mt-2">
                <ScheduleMatchForm
                  matchId={m.id}
                  roundId={roundId}
                  venues={venues.map((v) => ({ id: v.id, name: v.name }))}
                  currentVenueId={m.venueId}
                  currentScheduledAt={m.scheduledAt}
                />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
