import Link from 'next/link';
import { CHAMPIONSHIP_STATUS_LABELS } from '@reb/contracts';
import { Shell } from '@/components/ui/Shell';
import { IconTrophy } from '@/components/ui/icons';
import { getMyTournaments } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function TorneiosPage() {
  const tournaments = await getMyTournaments();

  return (
    <Shell>
      <h1 className="mb-5 text-xl font-bold text-ink">Meus torneios</h1>

      {tournaments.length === 0 ? (
        <p className="rounded-3xl border border-line/70 bg-surface/50 p-6 text-center text-ink-2">
          Você ainda não participa de nenhum torneio.
        </p>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link
              key={t.championshipId}
              href={`/torneios/${t.championshipId}`}
              className="block rounded-3xl border border-line/70 bg-surface/60 p-5 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">
                    {CHAMPIONSHIP_STATUS_LABELS[t.status]}
                  </p>
                </div>
                {t.isChampion ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
                    <IconTrophy width={14} height={14} /> Campeão
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Posição" value={t.position ? `${t.position}º` : '—'} />
                <Mini label="Pontos" value={String(t.points)} />
                <Mini label="Rodadas" value={String(t.roundsPlayed)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg/40 p-2.5">
      <div className="tabular text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
