import Link from 'next/link';

type Step = { title: string; body: string; href?: string; linkLabel?: string };

const STEPS: Step[] = [
  {
    title: 'Cadastrar jogadores',
    body: 'Registre os atletas do clube (nome, nascimento, nível). Jogadores inativos não entram em novas rodadas, mas mantêm o histórico.',
    href: '/players',
    linkLabel: 'Ir para Jogadores',
  },
  {
    title: 'Criar a temporada',
    body: 'A temporada (ex.: 2026) agrupa os campeonatos do ano.',
    href: '/seasons',
    linkLabel: 'Ir para Temporadas',
  },
  {
    title: 'Criar e ativar o campeonato',
    body: 'Defina nº de rodadas, classificados para a final e a configuração (pontuação, desempate, pesos do sorteio). Ao ativar, a configuração estrutural é bloqueada para preservar a integridade do ranking.',
    href: '/championships',
    linkLabel: 'Ir para Campeonatos',
  },
  {
    title: 'Abrir uma rodada e as inscrições',
    body: 'Dentro do campeonato ativo, crie a rodada e abra as inscrições. Confirme as presenças: o sorteio exige um número par de confirmados, entre 8 e 64.',
  },
  {
    title: 'Simular e confirmar o sorteio',
    body: 'O motor forma as melhores duplas e grupos (equilíbrio + parceiros inéditos). Simule quantas vezes quiser (não grava nada); ao gostar, confirme. Depois de confirmar e lançar resultados, o sorteio fica travado.',
  },
  {
    title: 'Lançar resultados dos grupos',
    body: 'Informe o placar de cada jogo (o vencedor sai do placar). W.O. tem opção "por lesão", que não penaliza o aproveitamento do lesionado. A classificação do grupo atualiza sozinha.',
  },
  {
    title: 'Gerar o mata-mata e jogar até o campeão',
    body: 'Com a fase de grupos concluída, gere o mata-mata (com disputa de 3º lugar). Ao terminar, a rodada é encerrada com a colocação final e os pontos.',
  },
  {
    title: 'Acompanhar o ranking e as estatísticas',
    body: 'O ranking soma os pontos por escopo (campeonato, temporada, geral), com aproveitamento e evolução. Cada jogador tem sua página de estatísticas.',
  },
  {
    title: 'Quadras e Agenda',
    body: 'Cadastre as quadras e vincule quadra/horário aos jogos. A agenda mostra rodadas, finais e permite lançar treinos/eventos.',
    href: '/venues',
    linkLabel: 'Ir para Quadras',
  },
  {
    title: 'Fase final do campeonato',
    body: 'Ao fim das rodadas, gere a fase final: os melhores por pontuação acumulada disputam com um novo sorteio (que pode repetir parceiros). Ela decide o campeão e não altera o ranking regular.',
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" className="font-bold text-ocean">
          Ranking Elite Beach
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Como funciona</span>
      </header>

      <section className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Guia do administrador</h1>
        <p className="mt-2 text-ink-2">
          O passo a passo para conduzir um campeonato do início ao campeão. Siga na ordem.
        </p>

        <ol className="mt-6 space-y-4">
          {STEPS.map((s, i) => (
            <li key={i} className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean text-sm font-bold text-ocean-ink">
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{s.title}</h2>
                  <p className="mt-1 text-sm text-ink-2">{s.body}</p>
                  {s.href && (
                    <Link href={s.href} className="mt-2 inline-block text-sm text-ocean hover:underline">
                      {s.linkLabel} →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <h2 className="mb-2 font-semibold">Regras que evitam dor de cabeça</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
            <li>O sorteio só roda com nº <strong>par</strong> de confirmados, de <strong>8 a 64</strong>.</li>
            <li>Ao <strong>ativar</strong> o campeonato, pontuação/desempate/final ficam <strong>bloqueados</strong>.</li>
            <li>Depois de lançar resultados, o sorteio da rodada <strong>não pode</strong> ser refeito.</li>
            <li>W.O. <strong>por lesão</strong> não derruba o aproveitamento do atleta lesionado.</li>
            <li>A <strong>fase final</strong> usa um novo sorteio (ignora o histórico de parceiros) e não muda o ranking.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
