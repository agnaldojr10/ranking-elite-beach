import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayerForm } from '@/components/PlayerForm';
import { getPlayer } from '@/lib/players';
import { updatePlayerAction } from '../../actions';

export default async function EditPlayerPage({ params }: { params: { id: string } }) {
  const player = await getPlayer(params.id);
  if (!player) notFound();

  const action = updatePlayerAction.bind(null, player.id);

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/players" className="font-bold text-ocean">
          Jogadores
        </Link>
        <span className="text-muted">/</span>
        <Link href={`/players/${player.id}`} className="hover:underline">
          {player.name}
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Editar</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Editar jogador</h1>
        <PlayerForm
          action={action}
          submitLabel="Salvar alterações"
          defaults={{
            name: player.name,
            photoUrl: player.photoUrl,
            birthDate: player.birthDate,
            phone: player.phone,
            skillLevel: player.skillLevel,
            status: player.status,
          }}
        />
      </section>
    </main>
  );
}
