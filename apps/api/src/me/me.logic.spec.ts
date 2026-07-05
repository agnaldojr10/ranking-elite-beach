import { describe, expect, it } from 'vitest';
import type { PlayerStats } from '@reb/contracts';
import { buildAchievements, tallyH2H } from './me.logic';

const baseStats: PlayerStats = {
  playerId: 'p1',
  playerName: 'Fulano',
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
};

describe('buildAchievements', () => {
  it('atleta sem histórico: todas as medalhas bloqueadas', () => {
    const list = buildAchievements(baseStats);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => !a.achieved)).toBe(true);
  });

  it('campeão com título dá conquista e tier', () => {
    const list = buildAchievements({ ...baseStats, titles: 1, finals: 1, bestPlacement: 1 });
    const champ = list.find((a) => a.code === 'champion')!;
    expect(champ.achieved).toBe(true);
    expect(champ.tier).toBe('bronze');
    expect(list.find((a) => a.code === 'podium')!.achieved).toBe(true);
  });

  it('tiers de sequência de vitórias escalam (bronze/prata/ouro)', () => {
    expect(buildAchievements({ ...baseStats, longestWinStreak: 3 }).find((a) => a.code === 'win_streak')!.tier).toBe('bronze');
    expect(buildAchievements({ ...baseStats, longestWinStreak: 5 }).find((a) => a.code === 'win_streak')!.tier).toBe('silver');
    expect(buildAchievements({ ...baseStats, longestWinStreak: 10 }).find((a) => a.code === 'win_streak')!.tier).toBe('gold');
  });

  it('consistente exige 5+ jogos e ≥60%', () => {
    expect(buildAchievements({ ...baseStats, wins: 2, losses: 1, winRate: 0.67 }).find((a) => a.code === 'consistent')!.achieved).toBe(false);
    expect(buildAchievements({ ...baseStats, wins: 4, losses: 2, winRate: 0.67 }).find((a) => a.code === 'consistent')!.achieved).toBe(true);
  });
});

describe('tallyH2H', () => {
  it('conta vitórias e derrotas do meu ponto de vista', () => {
    const r = tallyH2H([
      { myTeamId: 'A', winnerTeamId: 'A', isWalkover: false, walkoverInjury: false },
      { myTeamId: 'A', winnerTeamId: 'B', isWalkover: false, walkoverInjury: false },
      { myTeamId: 'A', winnerTeamId: 'A', isWalkover: false, walkoverInjury: false },
    ]);
    expect(r).toEqual({ wins: 2, losses: 1 });
  });

  it('ignora jogos sem vencedor', () => {
    const r = tallyH2H([{ myTeamId: 'A', winnerTeamId: null, isWalkover: false, walkoverInjury: false }]);
    expect(r).toEqual({ wins: 0, losses: 0 });
  });

  it('W.O. por lesão não conta derrota para o lesionado (BR-32)', () => {
    const r = tallyH2H([{ myTeamId: 'A', winnerTeamId: 'B', isWalkover: true, walkoverInjury: true }]);
    expect(r).toEqual({ wins: 0, losses: 0 });
  });
});
