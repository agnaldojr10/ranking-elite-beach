import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCORING_TABLE,
  buildSemifinalPairings,
  computeRoundPlacement,
  globalRank,
  planKnockout,
  pointsForPlacement,
  seedOrder,
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

describe('seedOrder', () => {
  it('chave de 8 usa seeding padrão', () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe('globalRank', () => {
  it('ordena todas as duplas por vitórias → saldo (entre grupos)', () => {
    const a = grp('A', [st('A1', 1, 2, 6), st('A2', 2, 1, 1), st('A3', 3, 0, -7)]);
    const b = grp('B', [st('B1', 1, 2, 4), st('B2', 2, 1, 3), st('B3', 3, 0, -6)]);
    const ids = globalRank([a, b]).map((r) => r.teamId);
    // 2 vitórias: A1(6) > B1(4); 1 vitória: B2(3) > A2(1); 0: B3(-6) > A3(-7)
    expect(ids).toEqual(['A1', 'B1', 'B2', 'A2', 'B3', 'A3']);
  });
});

describe('planKnockout (classificação flexível — Fase 14)', () => {
  it('9 duplas (3 grupos de 3): 6 classificados, 2 byes + quartas', () => {
    // Grupos dispostos p/ que seeds 3&6 e 4&5 fiquem em grupos distintos (sem revanche).
    // Ranking global (vitórias→saldo): G1..G9.
    const a = grp('A', [st('G1', 1, 2, 9), st('G6', 2, 1, 0), st('G7', 3, 0, -6)]);
    const b = grp('B', [st('G2', 1, 2, 7), st('G4', 2, 1, 2), st('G8', 3, 0, -8)]);
    const c = grp('C', [st('G3', 1, 2, 5), st('G5', 2, 1, 1), st('G9', 3, 0, -9)]);
    const plan = planKnockout([a, b, c]);

    expect(plan.format).toBe('QUARTER_WITH_BYES');
    expect(plan.qualifierCount).toBe(6);
    expect(plan.byes).toEqual(['G1', 'G2']); // 2 melhores vão direto à semi
    expect(plan.firstStage).toBe('QF');
    expect(plan.avoidSemiRematch).toBe(true); // anti-revanche também na semifinal
    // sem revanche: default 4×5 (slot0, enfrenta bye seed1) e 3×6 (slot1, enfrenta seed2)
    expect(plan.firstPairings).toContainEqual({ slot: 0, teamAId: 'G4', teamBId: 'G5' });
    expect(plan.firstPairings).toContainEqual({ slot: 1, teamAId: 'G3', teamBId: 'G6' });
  });

  it('inverte as quartas para evitar revanche de grupo', () => {
    // seed3 (G3) e seed6 (G6) caem no MESMO grupo C → 3×6 seria revanche.
    const a = grp('A', [st('G1', 1, 2, 9), st('G4', 2, 1, 2)]);
    const b = grp('B', [st('G2', 1, 2, 7), st('G5', 2, 1, 1)]);
    const c = grp('C', [st('G3', 1, 2, 5), st('G6', 2, 1, 0)]);
    const plan = planKnockout([a, b, c]);

    // alternativo: 3×5 e 4×6 (nenhuma revanche). slot0 = par com seed4, slot1 = par com seed3.
    expect(plan.firstPairings).toContainEqual({ slot: 0, teamAId: 'G4', teamBId: 'G6' });
    expect(plan.firstPairings).toContainEqual({ slot: 1, teamAId: 'G3', teamBId: 'G5' });
  });

  it('4 duplas (1 grupo): 4 classificados, semifinal direta 1×4, 2×3', () => {
    const a = grp('A', [st('T1', 1, 3, 9), st('T2', 2, 2, 3), st('T3', 3, 1, -3), st('T4', 4, 0, -9)]);
    const plan = planKnockout([a]);

    expect(plan.format).toBe('SEMI');
    expect(plan.qualifierCount).toBe(4);
    expect(plan.byes).toEqual([]);
    expect(plan.firstStage).toBe('SF');
    expect(plan.firstPairings).toEqual([
      { slot: 0, teamAId: 'T1', teamBId: 'T4' },
      { slot: 1, teamAId: 'T2', teamBId: 'T3' },
    ]);
  });

  it('2 grupos (16 jog.): 2 primeiros de cada grupo → semifinal cruzada', () => {
    const A = grp('A', [st('A1', 1, 3, 20), st('A2', 2, 2, 12), st('A3', 3, 1, -4), st('A4', 4, 0, -28)]);
    const B = grp('B', [st('B1', 1, 2, 5), st('B2', 2, 2, 3), st('B3', 3, 1, -3), st('B4', 4, 1, -5)]);
    const plan = planKnockout([A, B]);

    expect(plan.format).toBe('SEMI');
    expect(plan.qualifierCount).toBe(4);
    expect(plan.byes).toEqual([]);
    expect(plan.firstStage).toBe('SF');
    // classificados = 2 primeiros de cada grupo
    expect(new Set(plan.qualifiers.map((q) => q.teamId))).toEqual(new Set(['A1', 'B1', 'A2', 'B2']));
    // semifinal cruzada: 1ºA×2ºB e 1ºB×2ºA (mesmo grupo só se reencontra na final)
    expect(plan.firstPairings).toEqual([
      { slot: 0, teamAId: 'A1', teamBId: 'B2' },
      { slot: 1, teamAId: 'B1', teamBId: 'A2' },
    ]);
  });

  it('3 duplas: 2 classificados, Final direta', () => {
    const a = grp('A', [st('T1', 1, 2, 6), st('T2', 2, 1, 0), st('T3', 3, 0, -6)]);
    const plan = planKnockout([a]);
    expect(plan.format).toBe('FINAL');
    expect(plan.qualifierCount).toBe(2);
    expect(plan.firstStage).toBe('F');
    expect(plan.firstPairings).toEqual([{ slot: 0, teamAId: 'T1', teamBId: 'T2' }]);
  });
});

describe('buildSemifinalPairings (anti-revanche na semi — 2 grupos)', () => {
  const sameGroup = (a: string, b: string) => a[0] === b[0]; // 'A2'/'A3' = mesmo grupo

  it('troca a atribuição para o campeão não pegar quem enfrentou no grupo', () => {
    // byes A1(grupo A), B1(grupo B); vencedores das quartas: A2 (slot0), B2 (slot1)
    const sf = buildSemifinalPairings(['A1', 'B1'], ['A2', 'B2'], sameGroup, true);
    expect(sf).toContainEqual({ slot: 0, teamAId: 'A1', teamBId: 'B2' });
    expect(sf).toContainEqual({ slot: 1, teamAId: 'B1', teamBId: 'A2' });
  });

  it('mantém o padrão quando já não há revanche', () => {
    const sf = buildSemifinalPairings(['A1', 'B1'], ['B2', 'A2'], sameGroup, true);
    expect(sf).toEqual([
      { slot: 0, teamAId: 'A1', teamBId: 'B2' },
      { slot: 1, teamAId: 'B1', teamBId: 'A2' },
    ]);
  });

  it('sem avoidRematch, usa a atribuição padrão (sem trocar)', () => {
    const sf = buildSemifinalPairings(['A1', 'B1'], ['A2', 'B2'], sameGroup, false);
    expect(sf).toEqual([
      { slot: 0, teamAId: 'A1', teamBId: 'A2' },
      { slot: 1, teamAId: 'B1', teamBId: 'B2' },
    ]);
  });
});

describe('computeRoundPlacement', () => {
  it('quartas + byes (9 duplas): 1..6 pelo mata-mata, 7..9 por desempenho', () => {
    const a = grp('A', [st('G1', 1, 2, 9), st('G4', 2, 1, 2), st('G7', 3, 0, -6)]);
    const b = grp('B', [st('G2', 1, 2, 7), st('G5', 2, 1, 1), st('G8', 3, 0, -8)]);
    const c = grp('C', [st('G3', 1, 2, 5), st('G6', 2, 1, 0), st('G9', 3, 0, -9)]);
    // QF: G4×G5 (G4 vence), G3×G6 (G3 vence). SF: G1×G4 (G1), G2×G3 (G2). F: G1×G2 (G1). 3P: G4×G3 (G4).
    const knockout: KnockoutOutcome[] = [
      { stage: 'QF', winnerTeamId: 'G4', loserTeamId: 'G5' },
      { stage: 'QF', winnerTeamId: 'G3', loserTeamId: 'G6' },
      { stage: 'SF', winnerTeamId: 'G1', loserTeamId: 'G4' },
      { stage: 'SF', winnerTeamId: 'G2', loserTeamId: 'G3' },
      { stage: 'F', winnerTeamId: 'G1', loserTeamId: 'G2' },
      { stage: '3P', winnerTeamId: 'G4', loserTeamId: 'G3' },
    ];
    const placement = computeRoundPlacement({ knockout, groupStandings: [a, b, c], bracketSize: 6 });
    const pos = new Map(placement.map((p) => [p.teamId, p.position]));
    expect(pos.get('G1')).toBe(1);
    expect(pos.get('G2')).toBe(2);
    expect(pos.get('G4')).toBe(3); // venceu a disputa de 3º
    expect(pos.get('G3')).toBe(4);
    // perdedores das quartas → 5,6 por desempenho de grupo (G5 saldo 1 > G6 saldo 0)
    expect(pos.get('G5')).toBe(5);
    expect(pos.get('G6')).toBe(6);
    // não classificados 7..9 por desempenho (G7 -6 > G8 -8 > G9 -9)
    expect(pos.get('G7')).toBe(7);
    expect(pos.get('G8')).toBe(8);
    expect(pos.get('G9')).toBe(9);
    expect([...pos.values()].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('semifinal (4 duplas): final + 3º definem 1..4; não classificados por desempenho', () => {
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
    expect(pos.get('B3')).toBe(5); // saldo -6 > -8
    expect(pos.get('A3')).toBe(6);
    expect([...pos.values()].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Final direta (chave 2): final define 1/2, restante por grupo', () => {
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

  it('aplica o piso de participação fora da tabela', () => {
    const table = { '1': 100, '2': 70, '3': 50, '4': 30 };
    expect(pointsForPlacement(table, 1, 10)).toBe(100); // colocado usa a tabela
    expect(pointsForPlacement(table, 4, 10)).toBe(30);
    expect(pointsForPlacement(table, 9, 10)).toBe(10); // fora da tabela = participação
    expect(pointsForPlacement(table, 9)).toBe(0); // sem piso, mantém 0
  });
});
