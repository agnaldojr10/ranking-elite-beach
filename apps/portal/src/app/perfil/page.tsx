import Link from 'next/link';
import { SKILL_LEVEL_LABELS } from '@reb/contracts';
import { AchievementBadge } from '@/components/ui/AchievementBadge';
import { Avatar } from '@/components/ui/Avatar';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { Shell } from '@/components/ui/Shell';
import { StatTile } from '@/components/ui/StatTile';
import { getMyAchievements, getMyProfile, getMyStats } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const [profile, stats, achievements] = await Promise.all([
    getMyProfile(),
    getMyStats(),
    getMyAchievements(),
  ]);

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink-2">Não foi possível carregar seu perfil.</p>
        <LogoutButton />
      </main>
    );
  }

  return (
    <Shell>
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Meus números</h1>
        <LogoutButton />
      </header>

      <section className="mb-4 flex items-center gap-4 rounded-3xl border border-line/70 bg-surface/60 p-5">
        <Avatar name={profile.name} photoUrl={profile.photoUrl} size={64} />
        <div>
          <p className="text-lg font-bold text-ink">{profile.name}</p>
          <p className="text-sm text-ink-2">
            {SKILL_LEVEL_LABELS[profile.skillLevel]}
            {profile.age ? ` · ${profile.age} anos` : ''}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Campeonatos" value={stats?.championshipsPlayed ?? 0} />
        <StatTile label="Rodadas" value={stats?.roundsPlayed ?? 0} />
        <StatTile label="Vitórias" value={stats?.wins ?? 0} accent="ocean" />
        <StatTile label="Derrotas" value={stats?.losses ?? 0} />
        <StatTile
          label="Aproveitamento"
          value={stats ? `${Math.round(stats.winRate * 100)}%` : '—'}
          accent="ocean"
        />
        <StatTile label="Pontos" value={stats?.points ?? 0} />
        <StatTile label="Títulos" value={stats?.titles ?? 0} accent="gold" />
        <StatTile label="Finais" value={stats?.finals ?? 0} accent="gold" />
        <StatTile
          label="Melhor sequência"
          value={stats?.longestWinStreak ?? 0}
          accent="coral"
          hint="vitórias seguidas"
        />
        <StatTile
          label="Melhor colocação"
          value={stats?.bestPlacement ? `${stats.bestPlacement}º` : '—'}
        />
      </div>

      {achievements.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Conquistas</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {achievements.map((a) => (
              <AchievementBadge key={a.code} a={a} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Rivais</h2>
          <Link href="/h2h" className="text-sm font-semibold text-ocean">
            Ver todos ›
          </Link>
        </div>
        <div className="mt-2 space-y-3">
          {stats?.favoritePartner ? (
            <RelRow
              label="Parceiro favorito"
              name={stats.favoritePartner.playerName}
              detail={`${stats.favoritePartner.timesTogether}× juntos`}
            />
          ) : null}
          {stats?.topOpponent ? (
            <Link href={`/h2h/${stats.topOpponent.playerId}`} className="block">
              <RelRow
                label="Maior rival"
                name={stats.topOpponent.playerName}
                detail={`${stats.topOpponent.timesFaced}× · ver H2H ›`}
              />
            </Link>
          ) : null}
        </div>
      </section>
    </Shell>
  );
}

function RelRow({ label, name, detail }: { label: string; name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface/50 px-4 py-3">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
        <p className="font-semibold text-ink">{name}</p>
      </div>
      <span className="text-sm text-ink-2">{detail}</span>
    </div>
  );
}
