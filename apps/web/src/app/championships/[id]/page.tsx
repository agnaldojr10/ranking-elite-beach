import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CHAMPIONSHIP_STATUS_LABELS,
  ROUND_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  TIEBREAKER_LABELS,
  roundLabel,
} from '@reb/contracts';
import { getChampionship } from '@/lib/championships';
import { listRounds } from '@/lib/rounds';
import { getFinalState } from '@/lib/finals';
import { generateFinalAction, setChampionshipStatusAction } from '../actions';

export default async function ChampionshipDetailPage({ params }: { params: { id: string } }) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const [rounds, finalState] = await Promise.all([listRounds(params.id), getFinalState(params.id)]);
  const { config } = champ;
  const isDraft = champ.status === 'DRAFT';
  const isActive = champ.status === 'ACTIVE';
  const activate = setChampionshipStatusAction.bind(null, champ.id, 'ACTIVE');
  const finish = setChampionshipStatusAction.bind(null, champ.id, 'FINISHED');

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{champ.name}</span>
      </header>

      <section className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{champ.name}</h1>
            <p className="text-ink-2">
              {CHAMPIONSHIP_STATUS_LABELS[champ.status]} · {champ.roundsCount} rodadas ·{' '}
              {champ.qualifiersCount} classificados
              {champ.startDate ? ` · início ${champ.startDate}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDraft && (
              <Link
                href={`/championships/${champ.id}/ranking`}
                className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
              >
                Ranking
              </Link>
            )}
            {isDraft && (
              <Link
                href={`/championships/${champ.id}/edit`}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2"
              >
                Editar dados
              </Link>
            )}
            <Link
              href={`/championships/${champ.id}/config`}
              className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2"
            >
              Editar configuração
            </Link>
            {isDraft && (
              <form action={activate}>
                <button className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90">
                  Ativar campeonato
                </button>
              </form>
            )}
            {isActive && (
              <form action={finish}>
                <button className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2">
                  Encerrar
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Pontuação por colocação">
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.keys(config.scoringTable)
                .map(Number)
                .sort((a, b) => a - b)
                .map((p) => (
                  <span key={p} className="rounded-md bg-surface-2 px-2 py-1">
                    {p}º: <strong>{config.scoringTable[String(p)]}</strong>
                  </span>
                ))}
            </div>
          </Panel>

          <Panel title="Critérios de desempate">
            <ol className="list-inside list-decimal text-sm text-ink">
              {config.tiebreakers.map((t) => (
                <li key={t}>{TIEBREAKER_LABELS[t]}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="Motor de sorteio">
            <ul className="text-sm text-ink">
              <li>Peso ranking: {config.drawWeights.ranking}</li>
              <li>Peso nível: {config.drawWeights.skill}</li>
              <li>Peso histórico parceiros: {config.drawWeights.partner}</li>
              <li>Peso histórico adversários: {config.drawWeights.opponent}</li>
              <li>Aleatoriedade: {config.randomness}%</li>
              <li>Repetir parceiros: {config.allowRepeatPartners ? 'sim' : 'não'}</li>
              <li>Repetir adversários: {config.allowRepeatOpponents ? 'sim' : 'não'}</li>
            </ul>
          </Panel>

          <Panel title="Fase final">
            <p className="text-sm text-ink">
              Grupos de {config.finalConfig.groupSizePreference} duplas + mata-mata. Classificam-se
              os {champ.qualifiersCount} melhores por pontuação acumulada (novo sorteio, ignorando
              histórico de parceiros — BR-34).
            </p>
          </Panel>
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Rodadas ({rounds.length})</h2>
            {!isDraft && (
              <Link
                href={`/championships/${champ.id}/rounds/new`}
                className="rounded-full bg-ocean px-4 py-2 text-sm font-medium text-ocean-ink transition hover:opacity-90"
              >
                + Nova rodada
              </Link>
            )}
          </div>
          {isDraft ? (
            <p className="text-sm text-ink-2">
              Ative o campeonato para começar a criar rodadas e abrir inscrições.
            </p>
          ) : rounds.length === 0 ? (
            <p className="text-sm text-ink-2">
              Nenhuma rodada ainda. Crie a primeira em &ldquo;Nova rodada&rdquo;.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-ink-2">
                <tr>
                  <th className="py-2">Rodada</th>
                  <th className="py-2">Data</th>
                  <th className="py-2">Situação</th>
                  <th className="py-2">Confirmados</th>
                  <th className="py-2 text-right">Sorteável</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id} className="border-t border-line hover:bg-surface-2">
                    <td className="py-2">
                      <Link href={`/rounds/${r.id}`} className="font-medium text-ocean hover:underline">
                        {roundLabel({ kind: r.kind, number: r.number })}
                      </Link>
                    </td>
                    <td className="py-2">{r.date ?? '—'}</td>
                    <td className="py-2">{ROUND_STATUS_LABELS[r.status]}</td>
                    <td className="py-2">{r.summary.confirmed}</td>
                    <td className="py-2 text-right">{r.readiness.canDraw ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Fase final</h2>
            {isActive && !finalState && (
              <form action={generateFinalAction.bind(null, champ.id)}>
                <button className="rounded-full bg-ocean px-4 py-2 text-sm font-medium text-ocean-ink transition hover:opacity-90">
                  Gerar fase final
                </button>
              </form>
            )}
          </div>
          {finalState ? (
            <div className="text-sm">
              <Link href={`/rounds/${finalState.roundId}`} className="font-medium text-ocean hover:underline">
                Ir para a fase final (Rodada {finalState.number})
              </Link>
              {finalState.champion && (
                <p className="mt-2 rounded-md bg-ok/10 px-3 py-2 text-ok">
                  🏆 Campeão: <strong>{finalState.champion.playerNames.join(' + ')}</strong>
                </p>
              )}
            </div>
          ) : isActive ? (
            <p className="text-sm text-ink-2">
              Classifica os {champ.qualifiersCount} melhores por pontuação acumulada e faz um novo
              sorteio (ignorando o histórico de parceiros — BR-34).
            </p>
          ) : (
            <p className="text-sm text-ink-2">
              A fase final é gerada com o campeonato ativo, após as rodadas regulares.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted">
          Nível técnico de referência: {Object.values(SKILL_LEVEL_LABELS).join(' · ')}. O motor de
          sorteio entra na próxima sprint.
        </p>
      </section>
    </main>
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
