import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Shell } from '@/components/ui/Shell';
import { getMyOpponents } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function H2HListPage() {
  const opponents = await getMyOpponents();

  return (
    <Shell>
      <Link href="/perfil" className="text-sm text-ocean">
        ‹ Perfil
      </Link>
      <h1 className="mb-5 mt-2 text-xl font-bold text-ink">Rivais</h1>

      {opponents.length === 0 ? (
        <p className="rounded-3xl border border-line/70 bg-surface/50 p-6 text-center text-ink-2">
          Você ainda não enfrentou ninguém.
        </p>
      ) : (
        <div className="space-y-2">
          {opponents.map((o) => (
            <Link
              key={o.playerId}
              href={`/h2h/${o.playerId}`}
              className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface/50 p-3 transition-transform active:scale-[0.99]"
            >
              <Avatar name={o.playerName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{o.playerName}</p>
                <p className="text-xs text-muted">{o.timesFaced}× enfrentados</p>
              </div>
              <span className="text-ocean">›</span>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
