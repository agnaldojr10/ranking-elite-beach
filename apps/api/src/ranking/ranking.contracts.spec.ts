import { describe, expect, it } from 'vitest';
import {
  RankingEntrySchema,
  RankingScopeSchema,
  computeWinRate,
  rankPlayers,
  type RankingRow,
} from '@reb/contracts';

describe('computeWinRate (BR-32)', () => {
  it('3V/1D = 75%', () => {
    expect(computeWinRate(3, 1)).toBe(0.75);
  });
  it('sem jogos = 0', () => {
    expect(computeWinRate(0, 0)).toBe(0);
  });
  it('100% quando só vitórias', () => {
    expect(computeWinRate(4, 0)).toBe(1);
  });
});

describe('rankPlayers (BR-33 → BR-29)', () => {
  const row = (id: string, points: number, gamesBalance: number, wins = 0, losses = 0): RankingRow => ({
    playerId: id,
    playerName: id,
    points,
    rounds: 1,
    wins,
    losses,
    gamesBalance,
  });

  it('ordena por pontos e atribui posições 1..N', () => {
    const r = rankPlayers([row('A', 50, 0), row('B', 100, 0), row('C', 70, 0)]);
    expect(r.map((x) => x.playerId)).toEqual(['B', 'C', 'A']);
    expect(r.map((x) => x.position)).toEqual([1, 2, 3]);
  });

  it('empate em pontos → desempata por saldo de games', () => {
    const r = rankPlayers([row('A', 100, 5), row('B', 100, 12)]);
    expect(r[0]!.playerId).toBe('B');
  });

  it('empate em pontos e saldo → desempata por aproveitamento', () => {
    const r = rankPlayers([row('A', 100, 0, 1, 3), row('B', 100, 0, 3, 1)]);
    expect(r[0]!.playerId).toBe('B');
    expect(r[0]!.winRate).toBe(0.75);
  });
});

describe('schemas', () => {
  it('RankingScopeSchema aceita os 3 escopos', () => {
    expect(RankingScopeSchema.options).toEqual(['CHAMPIONSHIP', 'SEASON', 'GLOBAL']);
  });
  it('RankingEntrySchema valida uma entrada', () => {
    const parsed = RankingEntrySchema.safeParse({
      playerId: 'p1',
      playerName: 'Ana',
      points: 100,
      rounds: 2,
      wins: 3,
      losses: 1,
      gamesBalance: 8,
      winRate: 0.75,
      position: 1,
    });
    expect(parsed.success).toBe(true);
  });
});
