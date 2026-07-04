import { SKILL_LEVEL_LABELS, type MeRanking, type Player, type PlayerStats } from '@reb/contracts';
import { Avatar } from './Avatar';
import { RankDelta } from './RankDelta';

/** "Hero" do atleta: identidade + destaque de ranking e aproveitamento. */
export function PlayerHeroCard({
  profile,
  ranking,
  stats,
}: {
  profile: Player;
  ranking: MeRanking | null;
  stats: PlayerStats | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line/70 bg-gradient-to-br from-surface/90 to-surface-2/70 p-5 shadow-glow animate-fade-up">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ocean/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <Avatar name={profile.name} photoUrl={profile.photoUrl} size={72} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-ink">{profile.name}</h1>
          <p className="mt-0.5 text-sm text-ink-2">
            {SKILL_LEVEL_LABELS[profile.skillLevel]}
            {profile.age ? ` · ${profile.age} anos` : ''}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3">
        <HeroStat
          label="Ranking"
          value={ranking?.position ? `${ranking.position}º` : '—'}
          extra={ranking?.delta != null ? <RankDelta delta={ranking.delta} /> : undefined}
        />
        <HeroStat label="Pontos" value={ranking ? String(ranking.points) : '0'} />
        <HeroStat
          label="Aproveitamento"
          value={stats ? `${Math.round(stats.winRate * 100)}%` : '—'}
        />
      </div>
      {ranking?.championshipName ? (
        <p className="relative mt-3 text-xs text-muted">
          {ranking.championshipName}
          {ranking.total ? ` · ${ranking.total} atletas` : ''}
        </p>
      ) : null}
    </section>
  );
}

function HeroStat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-bg/40 p-3 text-center">
      <div className="flex items-center justify-center gap-1">
        <span className="tabular text-xl font-bold text-ink">{value}</span>
        {extra}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
