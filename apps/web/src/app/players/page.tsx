import Link from 'next/link';
import {
  PLAYER_STATUS_LABELS,
  PlayerStatusSchema,
  SKILL_LEVEL_LABELS,
  SkillLevelSchema,
} from '@reb/contracts';
import { Avatar } from '@/components/Avatar';
import { listPlayers } from '@/lib/players';

type SearchParams = { q?: string; status?: string; level?: string; page?: string };

export default async function PlayersPage({ searchParams }: { searchParams: SearchParams }) {
  const result = await listPlayers(searchParams);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const field = 'rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ocean';

  const pageLink = (page: number) => {
    const qs = new URLSearchParams();
    if (searchParams.q) qs.set('q', searchParams.q);
    if (searchParams.status) qs.set('status', searchParams.status);
    if (searchParams.level) qs.set('level', searchParams.level);
    qs.set('page', String(page));
    return `/players?${qs.toString()}`;
  };

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-ocean">
            Ranking Elite Beach
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-medium">Jogadores</span>
        </div>
        <Link
          href="/players/new"
          className="rounded-md bg-ocean px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Novo jogador
        </Link>
      </header>

      <section className="p-6">
        <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
          <input
            name="q"
            placeholder="Buscar por nome…"
            defaultValue={searchParams.q ?? ''}
            className={field}
          />
          <select name="status" defaultValue={searchParams.status ?? ''} className={field}>
            <option value="">Todos os status</option>
            {PlayerStatusSchema.options.map((s) => (
              <option key={s} value={s}>
                {PLAYER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select name="level" defaultValue={searchParams.level ?? ''} className={field}>
            <option value="">Todos os níveis</option>
            {SkillLevelSchema.options.map((l) => (
              <option key={l} value={l}>
                {SKILL_LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
            Filtrar
          </button>
        </form>

        {result.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Nenhum jogador encontrado.{' '}
            <Link href="/players/new" className="text-ocean hover:underline">
              Cadastrar o primeiro
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Idade</th>
                  <th className="px-4 py-3">Nível</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                        <Avatar name={p.name} photoUrl={p.photoUrl} size={36} />
                        <span className="font-medium text-slate-800">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.age}</td>
                    <td className="px-4 py-3">{SKILL_LEVEL_LABELS[p.skillLevel]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === 'ACTIVE'
                            ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                            : 'rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600'
                        }
                      >
                        {PLAYER_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            {result.total} jogador(es) · página {result.page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link href={pageLink(result.page - 1)} className="rounded-md border px-3 py-1 hover:bg-slate-100">
                Anterior
              </Link>
            )}
            {result.page < totalPages && (
              <Link href={pageLink(result.page + 1)} className="rounded-md border px-3 py-1 hover:bg-slate-100">
                Próxima
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
