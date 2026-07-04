import { z } from 'zod';

export const RankingScopeSchema = z.enum(['CHAMPIONSHIP', 'SEASON', 'GLOBAL']);
export type RankingScope = z.infer<typeof RankingScopeSchema>;

export const RANKING_SCOPE_LABELS: Record<RankingScope, string> = {
  CHAMPIONSHIP: 'Campeonato',
  SEASON: 'Temporada',
  GLOBAL: 'Geral',
};

export const RankingEntrySchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  points: z.number().int().nonnegative(),
  rounds: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  gamesBalance: z.number().int(),
  winRate: z.number().min(0).max(1),
  position: z.number().int().positive(),
});
export type RankingEntry = z.infer<typeof RankingEntrySchema>;

export const RankingSchema = z.object({
  scope: RankingScopeSchema,
  entries: z.array(RankingEntrySchema),
});
export type Ranking = z.infer<typeof RankingSchema>;

export const RankingEvolutionSchema = z.object({
  rounds: z.array(z.number().int()), // números das rodadas (em ordem)
  players: z.array(
    z.object({
      playerId: z.string(),
      playerName: z.string(),
      cumulative: z.array(z.number().int()), // pontos acumulados por rodada
    }),
  ),
});
export type RankingEvolution = z.infer<typeof RankingEvolutionSchema>;

// ---------------------------------------------------------------------------
// Helpers puros (testáveis)
// ---------------------------------------------------------------------------

/** Aproveitamento = vitórias / (vitórias + derrotas); 0 sem jogos (BR-32). */
export function computeWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Number((wins / total).toFixed(4));
}

/** Dados agregados por jogador (antes da ordenação). */
export type RankingRow = {
  playerId: string;
  playerName: string;
  points: number;
  rounds: number;
  wins: number;
  losses: number;
  gamesBalance: number;
};

/**
 * Ordena o ranking (BR-33 → BR-29 adaptado): pontos → saldo de games → aproveitamento → nome.
 * Atribui posição 1..N (sem empate de posição).
 */
export function rankPlayers(rows: RankingRow[]): RankingEntry[] {
  const withRate = rows.map((r) => ({ ...r, winRate: computeWinRate(r.wins, r.losses) }));
  withRate.sort(
    (a, b) =>
      b.points - a.points ||
      b.gamesBalance - a.gamesBalance ||
      b.winRate - a.winRate ||
      a.playerName.localeCompare(b.playerName, 'pt-BR'),
  );
  return withRate.map((r, i) => ({
    playerId: r.playerId,
    playerName: r.playerName,
    points: r.points,
    rounds: r.rounds,
    wins: r.wins,
    losses: r.losses,
    gamesBalance: r.gamesBalance,
    winRate: r.winRate,
    position: i + 1,
  }));
}
