import Link from 'next/link';
import { ChampionshipForm } from '@/components/ChampionshipForm';
import { listSeasons } from '@/lib/championships';
import { createChampionshipAction } from '../actions';

export default async function NewChampionshipPage() {
  const seasons = await listSeasons();
  const openSeasons = seasons.filter((s) => s.status === 'OPEN');

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Novo</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Novo campeonato</h1>
        {openSeasons.length === 0 ? (
          <p className="text-ink-2">
            Você precisa de uma temporada aberta primeiro.{' '}
            <Link href="/seasons" className="text-ocean hover:underline">
              Criar temporada
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-2">
              A configuração (pontuação, desempate, pesos do sorteio) inicia com os padrões e pode
              ser ajustada depois na tela do campeonato.
            </p>
            <ChampionshipForm
              action={createChampionshipAction}
              seasons={openSeasons}
              submitLabel="Criar campeonato"
            />
          </>
        )}
      </section>
    </main>
  );
}
