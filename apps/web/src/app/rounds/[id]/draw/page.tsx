import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MATCH_STATUS_LABELS, roundLabel, type ConfirmedDraw } from '@reb/contracts';
import { DrawSimulation } from '@/components/DrawSimulation';
import { getConfirmedDraw, getRound } from '@/lib/rounds';
import { discardDrawAction } from '../../actions';

export default async function RoundDrawPage({ params }: { params: { id: string } }) {
  const round = await getRound(params.id);
  if (!round) notFound();

  // Rodada com sorteio confirmado (inclui em andamento/encerrada): tela é só leitura.
  const hasDraw =
    round.status === 'DRAWN' || round.status === 'IN_PROGRESS' || round.status === 'FINISHED';
  // Rodada aberta sem confirmados suficientes → não faz sentido simular.
  if (!hasDraw && !round.readiness.canDraw) redirect(`/rounds/${round.id}`);

  const label = roundLabel(round);

  const confirmed = hasDraw ? await getConfirmedDraw(round.id) : null;
  // Descarte só é permitido enquanto nenhum resultado foi lançado (rodada ainda DRAWN).
  const canDiscard = round.status === 'DRAWN';
  const discard = discardDrawAction.bind(null, round.id);

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-muted">/</span>
        <Link href={`/rounds/${round.id}`} className="font-medium text-ocean">
          {label}
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{hasDraw ? 'Sorteio confirmado' : 'Simulação de sorteio'}</span>
      </header>

      <section className="p-6">
        {hasDraw && confirmed ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Sorteio confirmado — {label}</h1>
                <p className="text-sm text-ink-2">
                  Gravado em {new Date(confirmed.createdAt).toLocaleString('pt-BR')}. As próximas
                  rodadas já levam este resultado em conta (histórico de parceiros/adversários).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/rounds/${round.id}/results`}
                  className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
                >
                  Resultados
                </Link>
                {canDiscard && (
                  <form action={discard}>
                    <button className="rounded-md border border-danger/30 px-4 py-2 text-sm text-danger hover:bg-danger/10">
                      Descartar sorteio
                    </button>
                  </form>
                )}
              </div>
            </div>
            <ConfirmedDrawView draw={confirmed} />
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold">Simulação de sorteio — {label}</h1>
            <p className="mb-6 text-sm text-ink-2">
              {round.summary.confirmed} confirmados. Ajuste a aleatoriedade e simule; cada simulação
              usa uma nova seed e não persiste. Quando gostar do resultado, confirme.
            </p>
            <DrawSimulation roundId={round.id} />
          </>
        )}
      </section>
    </main>
  );
}

function ConfirmedDrawView({ draw }: { draw: ConfirmedDraw }) {
  const teamName = new Map(draw.teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Qualidade" value={`${draw.qualityScore}/100`} />
        <Metric label="Parceiros repetidos" value={draw.metrics.repeatedPartners} />
        <Metric label="Adversários repetidos" value={draw.metrics.repeatedOpponents} />
        <Metric label="Diversidade de duplas" value={`${draw.metrics.partnerDiversity}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Duplas (${draw.teams.length})`}>
          <ul className="space-y-1 text-sm">
            {draw.teams.map((t) => (
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
            {draw.groups.map((g) => (
              <div key={g.name}>
                <p className="font-medium">Grupo {g.name}</p>
                <ul className="ml-2 mt-1 text-xs text-ink-2">
                  {draw.matches
                    .filter((m) => m.groupName === g.name)
                    .map((m) => (
                      <li key={m.id}>
                        {teamName.get(m.teamAId)?.label} × {teamName.get(m.teamBId)?.label}{' '}
                        <span className="text-muted">— {MATCH_STATUS_LABELS[m.status]}</span>
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
          {draw.explanations.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </Panel>

      <p className="text-xs text-muted">
        Os jogos entram em "A jogar"; o registro de resultados chega na Sprint 6. Descartar o sorteio
        reverte o histórico e reabre as inscrições.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
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