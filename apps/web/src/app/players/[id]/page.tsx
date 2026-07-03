import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLAYER_STATUS_LABELS, SKILL_LEVEL_LABELS } from '@reb/contracts';
import { Avatar } from '@/components/Avatar';
import { getPlayer } from '@/lib/players';
import { setPlayerStatusAction } from '../actions';

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const player = await getPlayer(params.id);
  if (!player) notFound();

  const nextStatus = player.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const toggleStatus = setPlayerStatusAction.bind(null, player.id, nextStatus);

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/players" className="font-bold text-ocean">
          Jogadores
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">{player.name}</span>
      </header>

      <section className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={player.name} photoUrl={player.photoUrl} size={72} />
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <p className="text-slate-500">
                {player.age} anos · {SKILL_LEVEL_LABELS[player.skillLevel]} ·{' '}
                {PLAYER_STATUS_LABELS[player.status]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/players/${player.id}/edit`}
              className="rounded-md bg-ocean px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Editar
            </Link>
            <form action={toggleStatus}>
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
                {player.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Telefone" value={player.phone ?? '—'} />
          <Info label="Nascimento" value={player.birthDate} />
          <Info label="Cadastro" value={new Date(player.createdAt).toLocaleDateString('pt-BR')} />
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-6 text-slate-500">
          <h2 className="mb-1 font-semibold text-slate-700">Estatísticas</h2>
          <p className="text-sm">
            Ranking, participações, vitórias e histórico aparecerão aqui quando os módulos de
            rodadas e jogos forem implementados (próximas sprints).
          </p>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
