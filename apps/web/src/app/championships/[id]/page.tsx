import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CHAMPIONSHIP_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  TIEBREAKER_LABELS,
} from '@reb/contracts';
import { getChampionship } from '@/lib/championships';
import { setChampionshipStatusAction } from '../actions';

export default async function ChampionshipDetailPage({ params }: { params: { id: string } }) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const { config } = champ;
  const isDraft = champ.status === 'DRAFT';
  const isActive = champ.status === 'ACTIVE';
  const activate = setChampionshipStatusAction.bind(null, champ.id, 'ACTIVE');
  const finish = setChampionshipStatusAction.bind(null, champ.id, 'FINISHED');

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">{champ.name}</span>
      </header>

      <section className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{champ.name}</h1>
            <p className="text-slate-500">
              {CHAMPIONSHIP_STATUS_LABELS[champ.status]} · {champ.roundsCount} rodadas ·{' '}
              {champ.qualifiersCount} classificados
              {champ.startDate ? ` · início ${champ.startDate}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <Link
                href={`/championships/${champ.id}/edit`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Editar dados
              </Link>
            )}
            <Link
              href={`/championships/${champ.id}/config`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Editar configuração
            </Link>
            {isDraft && (
              <form action={activate}>
                <button className="rounded-md bg-ocean px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                  Ativar campeonato
                </button>
              </form>
            )}
            {isActive && (
              <form action={finish}>
                <button className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
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
                  <span key={p} className="rounded-md bg-slate-100 px-2 py-1">
                    {p}º: <strong>{config.scoringTable[String(p)]}</strong>
                  </span>
                ))}
            </div>
          </Panel>

          <Panel title="Critérios de desempate">
            <ol className="list-inside list-decimal text-sm text-slate-700">
              {config.tiebreakers.map((t) => (
                <li key={t}>{TIEBREAKER_LABELS[t]}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="Motor de sorteio">
            <ul className="text-sm text-slate-700">
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
            <p className="text-sm text-slate-700">
              Grupos de {config.finalConfig.groupSizePreference} duplas + mata-mata. Classificam-se
              os {champ.qualifiersCount} melhores por pontuação acumulada (novo sorteio, ignorando
              histórico de parceiros — BR-34).
            </p>
          </Panel>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Nível técnico de referência: {Object.values(SKILL_LEVEL_LABELS).join(' · ')}. As rodadas e
          o motor de sorteio entram nas próximas sprints.
        </p>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
