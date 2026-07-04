import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCORING_TABLE,
  bracketSizeForGroups,
  computeRoundPlacement,
  firstRoundPairings,
  pointsForPlacement,
  seedOrder,
  selectQualifiers,
  type GroupStandings,
  type KnockoutOutcome,
  type Standing,
} from '@reb/contracts';

function st(teamId: string, position: number, wins: number, gamesBalance: number): Standing {
  return {
    teamId,
    label: teamId,
    playerNames: [`${teamId}a`, `${teamId}b`],
    played: 2,
    wins,
    losses: 2 - wins,
    gamesFor: gamesBalance > 0 ? gamesBalance : 0,
    gamesAgainst: gamesBalance < 0 ? -gamesBalance : 0,
    gamesBalance,
    position,
  };
}
const grp = (name: string, standings: Standing[]): GroupStandings => ({ groupName: name, standings });

describe('bracketSizeForGroups', () => {
  it('1→2, 2→4, 3→4, 5→8, 9→16', () => {
    expect(bracketSizeForGroups(1)).toBe(2);
    expect(bracketSizeForGroups(2)).toBe(4);
    expect(bracketSizeForGroups(3)).toBe(4);
    expect(bracketSizeForGroups(5)).toBe(8);
    expect(bracketSizeForGroups(9)).toBe(16);
  });
});

describe('seedOrder', () => {
  it('chave de 8 usa seeding padrão', () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe('selectQualifiers (FORMATS.md)', () => {
  it('G=1: top-2, chave 2', () => {
    const g = grp('A', [st('A1', 1, 3, 10), st('A2', 2, 2, 4), st('A3', 3, 1, -4), st('A4', 4, 0, -10)]);
    const { qualifiers, bracketSize } = selectQualifiers([g]);
    expect(bracketSize).toBe(2);
    expect(qualifiers.map((q) => q.teamId)).toEqual(['A1', 'A2']);
  });

  it('G=2: top-2 de cada, chave 4', () => {
    const a = grp('A', [st('A1', 1, 2, 6), st('A2', 2, 1, 0), st('A3', 3, 0, -6)]);
    const b = grp('B', [st('B1', 1, 2, 5), st('B2', 2, 1, 1), st('B3', 3, 0, -6)]);
    const { qualifiers, bracketSize } = selectQualifiers([a, b]);
    expect(bracketSize).toBe(4);
    expect(new Set(qualifiers.map((q) => q.teamId))).toEqual(new Set(['A1', 'B1', 'A2', 'B2']));
  });

  it('G=3: 3 vencedores + 1 melhor 2º (por vitórias→saldo), chave 4', () => {
    const a = grp('A', [st('A1', 1, 2, 6), st('A2', 2, 1, 5)]);
    const b = grp('B', [st('B1', 1, 2, 4), st('B2', 2, 1, 2)]);
    const c = grp('C', [st('C1', 1, 2, 3), st('C2', 2, 2, 1)]); // C2 é o melhor 2º (2 vitórias)
    const { qualifiers, bracketSize } = selectQualifiers([a, b, c]);
    expect(bracketSize).toBe(4);
    const ids = qualifiers.map((q) => q.teamId);
    expect(ids).toContain('C2');
    expect(ids).not.toContain('A2');
    expect(ids).not.toContain('B2');
    expect(qualifiers).toHaveLength(4);
  });
});

describe('firstRoundPairings', () => {
  it('G=2: cruzamento 1ºA×2ºB e 1ºB×2ºA', () => {
    const a = grp('A', [st('A1', 1, 2, 6), st('A2', 2, 1, 0)]);
    const b = grp('B', [st('B1', 1, 2, 5), st('B2', 2, 1, 1)]);
    const { qualifiers, bracketSize, groupCount } = selectQualifiers([a, b]);
    const pairings = firstRoundPairings(qualifiers, bracketSize, groupCount);
    expect(pairings).toHaveLength(2);
    // 1A×2B e 1B×2A
    expect(pairings).toContainEqual({ slot: 0, teamAId: 'A1', teamBId: 'B2' });
    expect(pairings).toContainEqual({ slot: 1, teamAId: 'B1', teamBId: 'A2' });
  });
});

describe('computeRoundPlacement (disputa de 3º)', () => {
  it('final + 3º definem 1..4; não classificados por desempenho', () => {
    const a = grp('A', [st('A1', 1, 2, 6), st('A2', 2, 1, 2), st('A3', 3, 0, -8)]);
    const b = grp('B', [st('B1', 1, 2, 5), st('B2', 2, 1, 3), st('B3', 3, 0, -6)]);
    const knockout: KnockoutOutcome[] = [
      { stage: 'SF', winnerTeamId: 'A1', loserTeamId: 'B2' },
      { stage: 'SF', winnerTeamId: 'B1', loserTeamId: 'A2' },
      { stage: 'F', winnerTeamId: 'A1', loserTeamId: 'B1' },
      { stage: '3P', winnerTeamId: 'B2', loserTeamId: 'A2' },
    ];
    const placement = computeRoundPlacement({ knockout, groupStandings: [a, b], bracketSize: 4 });
    const pos = new Map(placement.map((p) => [p.teamId, p.position]));
    expect(pos.get('A1')).toBe(1);
    expect(pos.get('B1')).toBe(2);
    expect(pos.get('B2')).toBe(3);
    expect(pos.get('A2')).toBe(4);
    // A3/B3 (não classificados) → 5 e 6, B3 tem saldo melhor? ambos 0 vitórias; B3 bal -6 > A3 -8
    expect(pos.get('B3')).toBe(5);
    expect(pos.get('A3')).toBe(6);
    // cobre 1..6 sem buracos
    expect([...pos.values()].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('G=1 (chave 2): final define 1/2, restante por grupo', () => {
    const a = grp('A', [
      st('A1', 1, 3, 9),
      st('A2', 2, 2, 3),
      st('A3', 3, 1, -3),
      st('A4', 4, 0, -9),
    ]);
    const knockout: KnockoutOutcome[] = [{ stage: 'F', winnerTeamId: 'A1', loserTeamId: 'A2' }];
    const placement = computeRoundPlacement({ knockout, groupStandings: [a], bracketSize: 2 });
    const pos = new Map(placement.map((p) => [p.teamId, p.position]));
    expect(pos.get('A1')).toBe(1);
    expect(pos.get('A2')).toBe(2);
    expect(pos.get('A3')).toBe(3);
    expect(pos.get('A4')).toBe(4);
  });
});

describe('pointsForPlacement (BR-30)', () => {
  it('usa a scoring_table; 0 fora dela', () => {
    expect(pointsForPlacement(DEFAULT_SCORING_TABLE, 1)).toBe(DEFAULT_SCORING_TABLE['1']);
    expect(pointsForPlacement(DEFAULT_SCORING_TABLE, 999)).toBe(0);
  });
});
