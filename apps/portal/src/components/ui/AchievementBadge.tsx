import type { MeAchievement } from '@reb/contracts';
import { IconTrophy } from './icons';

const tierRing: Record<string, string> = {
  gold: 'text-gold ring-gold/40 bg-gold/10',
  silver: 'text-ink ring-line bg-surface-2/60',
  bronze: 'text-coral ring-coral/40 bg-coral/10',
};

/** Medalha/conquista: colorida quando conquistada, esmaecida quando bloqueada. */
export function AchievementBadge({ a }: { a: MeAchievement }) {
  const tone = a.achieved ? (tierRing[a.tier ?? 'silver'] ?? tierRing.silver) : 'text-muted ring-line/60 bg-surface/40';
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-1 ${tone} ${a.achieved ? '' : 'opacity-55'}`}
    >
      <IconTrophy width={26} height={26} />
      <span className="text-xs font-semibold leading-tight">{a.label}</span>
      {a.achieved && a.value != null ? (
        <span className="tabular text-[11px] text-ink-2">{a.value}</span>
      ) : (
        <span className="text-[10px] text-muted">{a.description}</span>
      )}
    </div>
  );
}
