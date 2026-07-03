import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChampionship } from '@/lib/championships';
import { ChampionshipConfigForm } from '@/components/ChampionshipConfigForm';
import { updateConfigAction } from '../../actions';

export default async function ChampionshipConfigPage({ params }: { params: { id: string } }) {
  const champ = await getChampionship(params.id);
  if (!champ) notFound();

  const action = updateConfigAction.bind(null, champ.id);

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
        <span className="font-medium">Configuração</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Configuração do campeonato</h1>
        <ChampionshipConfigForm
          action={action}
          config={champ.config}
          locked={champ.status !== 'DRAFT'}
        />
      </section>
    </main>
  );
}
