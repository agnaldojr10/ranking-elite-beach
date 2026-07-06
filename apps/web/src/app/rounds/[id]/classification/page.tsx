import { notFound, redirect } from 'next/navigation';
import { roundLabel } from '@reb/contracts';
import { AppShell } from '@/components/ui/AppShell';
import { Tile } from '@/components/ui/Tile';
import { ClassificationForm } from '@/components/ClassificationForm';
import { getRound } from '@/lib/rounds';
import { listPlayers } from '@/lib/players';

export default async function ClassificationPage({ params }: { params: { id: string } }) {
  const round = await getRound(params.id);
  if (!round) notFound();
  if (round.status === 'FINISHED') redirect(`/rounds/${round.id}`);

  const players = (await listPlayers({ status: 'ACTIVE', pageSize: '200' })).data.map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const label = roundLabel(round);

  return (
    <AppShell
      crumbs={[
        { label: 'Campeonatos', href: '/championships' },
        { label: round.championshipName, href: `/championships/${round.championshipId}` },
        { label, href: `/rounds/${round.id}` },
        { label: 'Classificação' },
      ]}
    >
      <div className="space-y-4">
        <Tile>
          <h1 className="text-2xl font-bold tracking-tight">Lançar classificação — {label}</h1>
          <p className="mt-1 text-sm text-ink-2">
            Marque os participantes e informe as duplas do pódio (campeão, vice, 3º, 4º). Os demais
            recebem os pontos de participação. Use quando não houver placares para lançar.
          </p>
        </Tile>
        <ClassificationForm
          roundId={round.id}
          championshipId={round.championshipId}
          players={players}
        />
      </div>
    </AppShell>
  );
}
