import { describe, expect, it } from 'vitest';
import { DashboardSummarySchema, PlayerStatsSchema, computeStreaks } from '@reb/contracts';

describe('computeStreaks (RF-27)', () => {
  it('sequência só de vitórias', () => {
    expect(computeStreaks(['W', 'W', 'W'])).toEqual({ longestWin: 3, longestLoss: 0 });
  });
  it('alternado', () => {
    expect(computeStreaks(['W', 'L', 'W', 'W', 'L', 'L', 'L'])).toEqual({
      longestWin: 2,
      longestLoss: 3,
    });
  });
  it('vazio', () => {
    expect(computeStreaks([])).toEqual({ longestWin: 0, longestLoss: 0 });
  });
  it('só derrotas', () => {
    expect(computeStreaks(['L', 'L'])).toEqual({ longestWin: 0, longestLoss: 2 });
  });
});

describe('PlayerStatsSchema', () => {
  it('valida um objeto de estatísticas', () => {
    const parsed = PlayerStatsSchema.safeParse({
      playerId: 'p1',
      playerName: 'Ana',
      championshipsPlayed: 1,
      roundsPlayed: 3,
      points: 210,
      avgPoints: 70,
      wins: 6,
      losses: 2,
      winRate: 0.75,
      bestPlacement: 1,
      worstPlacement: 5,
      titles: 1,
      finals: 2,
      longestWinStreak: 4,
      longestLossStreak: 1,
      favoritePartner: { playerId: 'p2', playerName: 'Bia', timesTogether: 3 },
      topOpponent: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita jogador sem histórico (nulos/zeros)', () => {
    const parsed = PlayerStatsSchema.safeParse({
      playerId: 'p1',
      playerName: 'Ana',
      championshipsPlayed: 0,
      roundsPlayed: 0,
      points: 0,
      avgPoints: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      bestPlacement: null,
      worstPlacement: null,
      titles: 0,
      finals: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      favoritePartner: null,
      topOpponent: null,
    });
    expect(parsed.success).toBe(true);
  });
});

describe('DashboardSummarySchema', () => {
  it('valida um resumo', () => {
    const parsed = DashboardSummarySchema.safeParse({
      kpis: { activePlayers: 10, seasons: 1, championships: 2, rounds: 5, finishedRounds: 3 },
      nextRound: { id: 'r1', number: 4, kind: 'REGULAR', championshipName: 'Quinta', date: null, status: 'OPEN' },
      recentResults: [
        { roundId: 'r0', roundNumber: 3, kind: 'REGULAR', championshipName: 'Quinta', championNames: ['Ana', 'Bia'] },
      ],
      topRanking: [],
    });
    expect(parsed.success).toBe(true);
  });
});
