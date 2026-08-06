import Link from 'next/link';
import { notFound } from 'next/navigation';
import { roundLabel } from '@reb/contracts';
import { Shell } from '@/components/ui/Shell';
import { RoundConsole } from '@/components/RoundConsole';
import {
  getEligiblePlayers,
  getOperableRound,
  getRoundDraw,
  getRoundKnockout,
  getRoundMatches,
  getRoundResult,
  getRoundStandings,
} from '@/lib/rounds';

export const dynamic = 'force-dynamic';

export default async function OperarRodadaPage({ params }: { params: { id: string } }) {
  const round = await getOperableRound(params.id);
  if (!round) notFound();

  const [eligible, matches, standings, knockout, result, draw] = await Promise.all([
    getEligiblePlayers(round.id),
    getRoundMatches(round.id),
    getRoundStandings(round.id),
    getRoundKnockout(round.id),
    getRoundResult(round.id),
    getRoundDraw(round.id),
  ]);

  return (
    <Shell>
      <Link href="/rodada" className="text-sm text-ocean">
        ‹ Rodadas
      </Link>
      <header className="mb-4 mt-2">
        <h1 className="text-2xl font-bold text-ink">{roundLabel(round)}</h1>
      </header>

      <RoundConsole
        round={round}
        eligible={eligible}
        matches={matches}
        standings={standings}
        knockout={knockout}
        result={result}
        draw={draw}
      />
    </Shell>
  );
}
