import { notFound } from 'next/navigation';
import { roundLabel } from '@reb/contracts';
import { AppShell } from '@/components/ui/AppShell';
import { Tile } from '@/components/ui/Tile';
import { RoundForm, type RoundFormDefaults } from '@/components/RoundForm';
import { getRound } from '@/lib/rounds';
import { updateRoundAction } from '@/app/rounds/actions';

export default async function EditRoundPage({ params }: { params: { id: string } }) {
  const round = await getRound(params.id);
  if (!round) notFound();

  const label = roundLabel(round);
  const action = updateRoundAction.bind(null, round.id, round.championshipId);
  const defaults: RoundFormDefaults = {
    number: round.number,
    date: round.date ? round.date.slice(0, 10) : '',
    groupSizePref: round.groupSizePref,
    sets: round.matchFormat.sets,
    gamesPerSet: round.matchFormat.gamesPerSet,
    matchTieBreak: round.matchFormat.matchTieBreak,
  };

  return (
    <AppShell
      crumbs={[
        { label: 'Campeonatos', href: '/championships' },
        { label: round.championshipName, href: `/championships/${round.championshipId}` },
        { label, href: `/rounds/${round.id}` },
        { label: 'Editar' },
      ]}
    >
      <Tile>
        <h1 className="mb-2 text-xl font-semibold">Editar {label}</h1>
        <p className="mb-6 text-sm text-ink-2">
          Ajuste número, data, preferência de grupo e formato de partida. O tipo da rodada não é
          alterado aqui.
        </p>
        <RoundForm
          action={action}
          championshipId={round.championshipId}
          suggestedNumber={round.number}
          submitLabel="Salvar alterações"
          defaults={defaults}
          showKind={false}
          cancelHref={`/rounds/${round.id}`}
        />
      </Tile>
    </AppShell>
  );
}
