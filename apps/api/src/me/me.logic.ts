import type { AchievementTier, MeAchievement, PlayerStats } from '@reb/contracts';

/** Escolhe o tier (bronze/prata/ouro) pelo valor vs. limiares crescentes. */
function tierFor(value: number, [b, s, g]: [number, number, number]): AchievementTier | null {
  if (value >= g) return 'gold';
  if (value >= s) return 'silver';
  if (value >= b) return 'bronze';
  return null;
}

/**
 * Deriva as conquistas do atleta a partir dos números (PlayerStats). Função pura:
 * retorna todas as medalhas definidas, com `achieved` marcando as conquistadas
 * (as bloqueadas aparecem esmaecidas no portal).
 */
export function buildAchievements(stats: PlayerStats): MeAchievement[] {
  const list: MeAchievement[] = [];
  const add = (a: MeAchievement) => list.push(a);

  add({
    code: 'champion',
    label: 'Campeão',
    description: 'Terminar uma rodada em 1º lugar',
    achieved: stats.titles >= 1,
    value: stats.titles,
    tier: tierFor(stats.titles, [1, 3, 5]),
  });
  add({
    code: 'finalist',
    label: 'Finalista',
    description: 'Chegar a uma final (top 2)',
    achieved: stats.finals >= 1,
    value: stats.finals,
    tier: tierFor(stats.finals, [1, 3, 5]),
  });
  add({
    code: 'podium',
    label: 'Pódio',
    description: 'Terminar entre os 3 primeiros',
    achieved: stats.bestPlacement !== null && stats.bestPlacement <= 3,
    value: stats.bestPlacement,
    tier: null,
  });
  add({
    code: 'win_streak',
    label: 'Embalado',
    description: 'Sequência de vitórias',
    achieved: stats.longestWinStreak >= 3,
    value: stats.longestWinStreak,
    tier: tierFor(stats.longestWinStreak, [3, 5, 10]),
  });
  add({
    code: 'veteran',
    label: 'Veterano',
    description: 'Rodadas disputadas',
    achieved: stats.roundsPlayed >= 10,
    value: stats.roundsPlayed,
    tier: tierFor(stats.roundsPlayed, [10, 25, 50]),
  });
  add({
    code: 'winner',
    label: 'Vencedor',
    description: 'Vitórias acumuladas',
    achieved: stats.wins >= 10,
    value: stats.wins,
    tier: tierFor(stats.wins, [10, 30, 60]),
  });
  add({
    code: 'consistent',
    label: 'Consistente',
    description: 'Aproveitamento ≥ 60% (com 5+ jogos)',
    achieved: stats.wins + stats.losses >= 5 && stats.winRate >= 0.6,
    value: Math.round(stats.winRate * 100),
    tier: null,
  });

  return list;
}

export type H2HMatch = {
  myTeamId: string;
  winnerTeamId: string | null;
  isWalkover: boolean;
  walkoverInjury: boolean;
};

/**
 * Vitórias/derrotas do atleta num conjunto de confrontos. Ignora jogos sem
 * vencedor; W.O. por lesão não conta derrota para o lesionado (BR-32).
 */
export function tallyH2H(matches: H2HMatch[]): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    if (!m.winnerTeamId) continue;
    if (m.winnerTeamId === m.myTeamId) {
      wins += 1;
    } else {
      if (m.isWalkover && m.walkoverInjury) continue; // BR-32
      losses += 1;
    }
  }
  return { wins, losses };
}
