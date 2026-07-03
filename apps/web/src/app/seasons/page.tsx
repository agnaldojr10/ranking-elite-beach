import Link from 'next/link';
import { SEASON_STATUS_LABELS } from '@reb/contracts';
import { listSeasons } from '@/lib/championships';
import { SeasonCreateForm } from '@/components/SeasonCreateForm';
import { setSeasonStatusAction } from './actions';

export default async function SeasonsPage() {
  const seasons = await listSeasons();

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/dashboard" className="font-bold text-ocean">
          Ranking Elite Beach
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Temporadas</span>
      </header>

      <section className="p-6">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Nova temporada</h2>
          <SeasonCreateForm />
        </div>

        {seasons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Nenhuma temporada ainda. Crie a primeira acima.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
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
                    <tr key={s.id} className="border-t border-slate-100">
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
                          <button className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100">
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
