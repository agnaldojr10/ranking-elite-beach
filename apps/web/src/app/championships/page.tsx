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
    <main className="min-h-dvh">
      <header className="flex items-center justify-between sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-ocean">
            Ranking Elite Beach
          </Link>
          <span className="text-muted">/</span>
          <span className="font-medium">Campeonatos</span>
        </div>
        <div className="flex gap-2">
          <Link href="/seasons" className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2">
            Temporadas
          </Link>
          <Link
            href="/championships/new"
            className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
          >
            + Novo campeonato
          </Link>
        </div>
      </header>

      <section className="p-6">
        {championships.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nenhum campeonato ainda.{' '}
            <Link href="/championships/new" className="text-ocean hover:underline">
              Criar o primeiro
            </Link>
            . (É preciso ter uma temporada antes.)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Rodadas</th>
                  <th className="px-4 py-3">Classificados</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {championships.map((c) => (
                  <tr key={c.id} className="border-t border-line hover:bg-surface-2">
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
