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
  const field = 'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

  const pageLink = (page: number) => {
    const qs = new URLSearchParams();
    if (searchParams.q) qs.set('q', searchParams.q);
    if (searchParams.status) qs.set('status', searchParams.status);
    if (searchParams.level) qs.set('level', searchParams.level);
    qs.set('page', String(page));
    return `/players?${qs.toString()}`;
  };

  return (
    <main className="min-h-dvh">
      <header className="flex items-center justify-between sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-ocean">
            Ranking Elite Beach
          </Link>
          <span className="text-muted">/</span>
          <span className="font-medium">Jogadores</span>
        </div>
        <Link
          href="/players/new"
          className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
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
          <button className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2">
            Filtrar
          </button>
        </form>

        {result.data.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nenhum jogador encontrado.{' '}
            <Link href="/players/new" className="text-ocean hover:underline">
              Cadastrar o primeiro
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-tile">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Idade</th>
                  <th className="px-4 py-3">Nível</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => (
                  <tr key={p.id} className="border-t border-line hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/players/${p.id}`} className="flex items-center gap-3">
                        <Avatar name={p.name} photoUrl={p.photoUrl} size={36} />
                        <span className="font-medium text-ink">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.age}</td>
                    <td className="px-4 py-3">{SKILL_LEVEL_LABELS[p.skillLevel]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === 'ACTIVE'
                            ? 'rounded-full bg-ok/15 px-2 py-0.5 text-xs text-ok'
                            : 'rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2'
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

        <div className="mt-4 flex items-center justify-between text-sm text-ink-2">
          <span>
            {result.total} jogador(es) · página {result.page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link href={pageLink(result.page - 1)} className="rounded-full border border-line px-3 py-1 transition hover:bg-surface-2">
                Anterior
              </Link>
            )}
            {result.page < totalPages && (
              <Link href={pageLink(result.page + 1)} className="rounded-full border border-line px-3 py-1 transition hover:bg-surface-2">
                Próxima
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
