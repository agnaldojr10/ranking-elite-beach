import { z } from 'zod';
import { RankingEntrySchema } from './ranking';
import { RoundKindSchema, RoundStatusSchema } from './round';

const PartnerRefSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  timesTogether: z.number().int().nonnegative(),
});
const OpponentRefSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  timesFaced: z.number().int().nonnegative(),
});

export const PlayerStatsSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  championshipsPlayed: z.number().int().nonnegative(),
  roundsPlayed: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  avgPoints: z.number().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(1),
  bestPlacement: z.number().int().positive().nullable(),
  worstPlacement: z.number().int().positive().nullable(),
  titles: z.number().int().nonnegative(),
  finals: z.number().int().nonnegative(),
  longestWinStreak: z.number().int().nonnegative(),
  longestLossStreak: z.number().int().nonnegative(),
  favoritePartner: PartnerRefSchema.nullable(),
  topOpponent: OpponentRefSchema.nullable(),
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

export const DashboardSummarySchema = z.object({
  kpis: z.object({
    activePlayers: z.number().int().nonnegative(),
    seasons: z.number().int().nonnegative(),
    championships: z.number().int().nonnegative(),
    rounds: z.number().int().nonnegative(),
    finishedRounds: z.number().int().nonnegative(),
  }),
  nextRound: z
    .object({
      id: z.string(),
      number: z.number().int(),
      kind: RoundKindSchema,
      championshipName: z.string(),
      date: z.string().nullable(),
      status: RoundStatusSchema,
    })
    .nullable(),
  recentResults: z.array(
    z.object({
      roundId: z.string(),
      roundNumber: z.number().int(),
      kind: RoundKindSchema,
      championshipName: z.string(),
      championNames: z.array(z.string()),
    }),
  ),
  topRanking: z.array(RankingEntrySchema),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

/** Maior sequência de vitórias e de derrotas a partir dos resultados em ordem cronológica. */
export function computeStreaks(outcomes: ('W' | 'L')[]): {
  longestWin: number;
  longestLoss: number;
} {
  let longestWin = 0;
  let longestLoss = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const o of outcomes) {
    if (o === 'W') {
      curWin += 1;
      curLoss = 0;
      if (curWin > longestWin) longestWin = curWin;
    } else {
      curLoss += 1;
      curWin = 0;
      if (curLoss > longestLoss) longestLoss = curLoss;
    }
  }
  return { longestWin, longestLoss };
}
