import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoundForm } from '@/components/RoundForm';
import { getChampionship } from '@/lib/championships';
import { listRounds } from '@/lib/rounds';
import { createRoundAction } from '@/app/rounds/actions';

export default async function NewRoundPage({ params }: { params: { id: string } }) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const rounds = await listRounds(params.id);
  const suggestedNumber = rounds.reduce((max, r) => Math.max(max, r.number), 0) + 1;
  const action = createRoundAction.bind(null, params.id);

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
        <span className="font-medium">Nova rodada</span>
      </header>

      <section className="p-6">
        <h1 className="mb-2 text-xl font-semibold">Nova rodada</h1>
        <p className="mb-6 text-sm text-ink-2">
          Campeonato com {champ.roundsCount} rodadas previstas. A rodada nasce com inscrições
          fechadas (Agendada); abra as inscrições na tela da rodada.
        </p>
        <RoundForm action={action} championshipId={champ.id} suggestedNumber={suggestedNumber} />
      </section>
    </main>
  );
}
