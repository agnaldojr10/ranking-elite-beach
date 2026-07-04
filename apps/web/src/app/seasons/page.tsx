import Link from 'next/link';
import { SEASON_STATUS_LABELS } from '@reb/contracts';
import { listSeasons } from '@/lib/championships';
import { SeasonCreateForm } from '@/components/SeasonCreateForm';
import { setSeasonStatusAction } from './actions';

export default async function SeasonsPage() {
  const seasons = await listSeasons();

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" className="font-bold text-ocean">
          Ranking Elite Beach
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Temporadas</span>
      </header>

      <section className="p-6">
        <div className="mb-6 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <h2 className="mb-3 font-semibold">Nova temporada</h2>
          <SeasonCreateForm />
        </div>

        {seasons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nenhuma temporada ainda. Crie a primeira acima.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className="px-4 py-3">Ano</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Campeonatos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => {
                  const nextStatus = s.status === 'OPEN' ? 'CLOSED' : 'OPEN';
                  const toggle = setSeasonStatusAction.bind(null, s.id, nextStatus);
                  return (
                    <tr key={s.id} className="border-t border-line">
                      <td className="px-4 py-3 font-medium">{s.year}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/championships?seasonId=${s.id}`}
                          className="text-ocean hover:underline"
                        >
                          {s.championshipsCount ?? 0}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{SEASON_STATUS_LABELS[s.status]}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={toggle} className="inline">
                          <button className="rounded-full border border-line px-3 py-1 text-xs transition hover:bg-surface-2">
                            {s.status === 'OPEN' ? 'Encerrar' : 'Reabrir'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
