import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChampionship } from '@/lib/championships';
import { ChampionshipForm } from '@/components/ChampionshipForm';
import { updateBasicsAction } from '../../actions';

export default async function EditChampionshipPage({ params }: { params: { id: string } }) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const action = updateBasicsAction.bind(null, champ.id);

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/championships" className="font-bold text-ocean">
          Campeonatos
        </Link>
        <span className="text-slate-400">/</span>
        <Link href={`/championships/${champ.id}`} className="hover:underline">
          {champ.name}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Editar dados</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Editar dados do campeonato</h1>
        <ChampionshipForm
          action={action}
          submitLabel="Salvar alterações"
          defaults={{
            name: champ.name,
            roundsCount: champ.roundsCount,
            qualifiersCount: champ.qualifiersCount,
            startDate: champ.startDate,
          }}
        />
      </section>
    </main>
  );
}
