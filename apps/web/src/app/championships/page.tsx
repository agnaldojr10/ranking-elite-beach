import Link from 'next/link';
import { CHAMPIONSHIP_STATUS_LABELS } from '@reb/contracts';
import { listChampionships } from '@/lib/championships';

export default async function ChampionshipsPage({
  searchParams,
}: {
  searchParams: { seasonId?: string };
}) {
  const championships = await listChampionships(searchParams.seasonId);

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-ocean">
            Ranking Elite Beach
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-medium">Campeonatos</span>
        </div>
        <div className="flex gap-2">
          <Link href="/seasons" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
            Temporadas
          </Link>
          <Link
            href="/championships/new"
            className="rounded-md bg-ocean px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Novo campeonato
          </Link>
        </div>
      </header>

      <section className="p-6">
        {championships.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Nenhum campeonato ainda.{' '}
            <Link href="/championships/new" className="text-ocean hover:underline">
              Criar o primeiro
            </Link>
            . (É preciso ter uma temporada antes.)
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Rodadas</th>
                  <th className="px-4 py-3">Classificados</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {championships.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/championships/${c.id}`} className="font-medium text-ocean hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.roundsCount}</td>
                    <td className="px-4 py-3">{c.qualifiersCount}</td>
                    <td className="px-4 py-3">{CHAMPIONSHIP_STATUS_LABELS[c.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
