import Link from 'next/link';
import { VenueForm } from '@/components/VenueForm';
import { listVenues } from '@/lib/venues';
import { createVenueAction, deleteVenueAction } from './actions';

export default async function VenuesPage() {
  const venues = await listVenues();

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" className="font-bold text-ocean">
          Ranking Elite Beach
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Quadras</span>
      </header>

      <section className="p-6">
        <div className="mb-6 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <h2 className="mb-3 font-semibold">Nova quadra</h2>
          <VenueForm action={createVenueAction} submitLabel="Criar quadra" />
        </div>

        {venues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nenhuma quadra cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className="px-4 py-3">Quadra</th>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => {
                  const remove = deleteVenueAction.bind(null, v.id);
                  return (
                    <tr key={v.id} className="border-t border-line">
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3">{v.number ?? '—'}</td>
                      <td className="px-4 py-3">{v.location ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/venues/${v.id}/edit`}
                            className="rounded-full border border-line px-3 py-1 text-xs transition hover:bg-surface-2"
                          >
                            Editar
                          </Link>
                          <form action={remove}>
                            <button className="rounded-full border border-danger/30 px-3 py-1 text-xs text-danger transition hover:bg-danger/10">
                              Excluir
                            </button>
                          </form>
                        </div>
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
