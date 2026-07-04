import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  RANKING_SCOPE_LABELS,
  RankingScopeSchema,
  type RankingEvolution,
  type RankingScope,
} from '@reb/contracts';
import { getChampionship } from '@/lib/championships';
import { getRanking, getRankingEvolution } from '@/lib/ranking';
import { LineChart } from '@/components/charts/LineChart';

export default async function RankingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { scope?: string };
}) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const scope: RankingScope = RankingScopeSchema.catch('CHAMPIONSHIP').parse(searchParams.scope);
  const [ranking, evolution] = await Promise.all([
    getRanking(champ.id, scope),
    getRankingEvolution(champ.id),
  ]);
  const entries = ranking?.entries ?? [];

  const scopeLink = (s: RankingScope) => `/championships/${champ.id}/ranking?scope=${s}`;
  const pct = (r: number) => `${Math.round(r * 100)}%`;

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-muted">/</span>
        <Link href={`/championships/${champ.id}`} className="font-medium text-ocean">
          {champ.name}
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Ranking</span>
      </header>

      <section className="space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          {RankingScopeSchema.options.map((s) => (
            <Link
              key={s}
              href={scopeLink(s)}
              className={
                s === scope
                  ? 'rounded-md bg-ocean px-4 py-2 text-sm font-medium text-ocean-ink'
                  : 'rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2'
              }
            >
              {RANKING_SCOPE_LABELS[s]}
            </Link>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nenhuma rodada encerrada com pontos neste escopo ainda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Rodadas</th>
                  <th className="px-4 py-3">V</th>
                  <th className="px-4 py-3">D</th>
                  <th className="px-4 py-3">Saldo</th>
                  <th className="px-4 py-3">Aproveit.</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.playerId} className="border-t border-line hover:bg-surface-2">
                    <td className="px-4 py-3 font-medium">{e.position}</td>
                    <td className="px-4 py-3">
                      <Link href={`/players/${e.playerId}`} className="text-ocean hover:underline">
                        {e.playerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold">{e.points}</td>
                    <td className="px-4 py-3">{e.rounds}</td>
                    <td className="px-4 py-3">{e.wins}</td>
                    <td className="px-4 py-3">{e.losses}</td>
                    <td className="px-4 py-3">
                      {e.gamesBalance > 0 ? `+${e.gamesBalance}` : e.gamesBalance}
                    </td>
                    <td className="px-4 py-3">{pct(e.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {scope === 'CHAMPIONSHIP' && evolution && evolution.rounds.length > 0 && (
          <EvolutionTable evolution={evolution} />
        )}
      </section>
    </main>
  );
}

function EvolutionTable({ evolution }: { evolution: RankingEvolution }) {
  const top = evolution.players.slice(0, 5);
  return (
    <div>
      <h2 className="mb-3 font-semibold">Evolução (pontos acumulados por rodada)</h2>
      {top.length > 0 && (
        <div className="mb-4 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <LineChart
            xLabels={evolution.rounds.map(String)}
            series={top.map((p) => ({ name: p.playerName, values: p.cumulative }))}
          />
          {evolution.players.length > top.length && (
            <p className="mt-2 text-xs text-muted">
              Mostrando os 5 primeiros; a tabela abaixo traz todos.
            </p>
          )}
        </div>
      )}
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-ink-2">
            <tr>
              <th className="px-4 py-3">Jogador</th>
              {evolution.rounds.map((n) => (
                <th key={n} className="px-3 py-3 text-right">
                  R{n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evolution.players.map((p) => (
              <tr key={p.playerId} className="border-t border-line">
                <td className="px-4 py-2">{p.playerName}</td>
                {p.cumulative.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-right">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
