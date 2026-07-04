import { Shell } from '@/components/ui/Shell';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { NextMatchCard } from '@/components/ui/NextMatchCard';
import { PlayerHeroCard } from '@/components/ui/PlayerHeroCard';
import { StatTile } from '@/components/ui/StatTile';
import { getMyNextMatch, getMyProfile, getMyRanking, getMyStats } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [profile, ranking, stats, nextMatch] = await Promise.all([
    getMyProfile(),
    getMyRanking(),
    getMyStats(),
    getMyNextMatch(),
  ]);

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold text-ink">Conta sem perfil de atleta</h1>
        <p className="text-ink-2">
          Este acesso não está vinculado a um jogador. Fale com a organização do seu torneio.
        </p>
        <LogoutButton />
      </main>
    );
  }

  const firstName = profile.name.split(' ')[0];

  return (
    <Shell>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Olá,</p>
          <p className="text-lg font-semibold text-ink">{firstName} 👋</p>
        </div>
        <LogoutButton />
      </header>

      <div className="space-y-4">
        <PlayerHeroCard profile={profile} ranking={ranking} stats={stats} />
        <NextMatchCard match={nextMatch} />

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Jogos" value={stats?.roundsPlayed ?? 0} />
          <StatTile
            label="Vitórias"
            value={stats?.wins ?? 0}
            accent="ocean"
            hint={stats ? `${stats.losses} derrotas` : undefined}
          />
          <StatTile label="Títulos" value={stats?.titles ?? 0} accent="gold" />
          <StatTile
            label="Sequência"
            value={stats?.longestWinStreak ?? 0}
            accent="coral"
            hint="melhor de vitórias"
          />
        </div>
      </div>
    </Shell>
  );
}
