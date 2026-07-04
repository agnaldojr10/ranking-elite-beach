import { describe, expect, it } from 'vitest';
import {
  RegisterMatchResultSchema,
  computeGroupStandings,
  computeMatchWinner,
  type StandingMatch,
  type StandingTeam,
} from '@reb/contracts';

const oneSet = { sets: 1 as const, gamesPerSet: 6 };
const bestOf3 = { sets: 3 as const, gamesPerSet: 6 };

describe('computeMatchWinner (BR-25)', () => {
  it('1 set: 6×4 → time A vence', () => {
    const r = computeMatchWinner([{ a: 6, b: 4 }], oneSet, 'A', 'B');
    expect(r).toEqual({ valid: true, winnerTeamId: 'A' });
  });

  it('1 set: 4×6 → time B vence', () => {
    const r = computeMatchWinner([{ a: 4, b: 6 }], oneSet, 'A', 'B');
    expect(r.valid && r.winnerTeamId).toBe('B');
  });

  it('1 set: 6×6 → inválido (sem vencedor)', () => {
    expect(computeMatchWinner([{ a: 6, b: 6 }], oneSet, 'A', 'B').valid).toBe(false);
  });

  it('1 set: 3×2 → inválido (não atingiu games do set)', () => {
    expect(computeMatchWinner([{ a: 3, b: 2 }], oneSet, 'A', 'B').valid).toBe(false);
  });

  it('melhor de 3: 6×4, 6×3 → A vence (2×0)', () => {
    const r = computeMatchWinner([{ a: 6, b: 4 }, { a: 6, b: 3 }], bestOf3, 'A', 'B');
    expect(r.valid && r.winnerTeamId).toBe('A');
  });

  it('melhor de 3: 6×4, 3×6, 7×5 → A vence (2×1)', () => {
    const r = computeMatchWinner(
      [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }],
      bestOf3,
      'A',
      'B',
    );
    expect(r.valid && r.winnerTeamId).toBe('A');
  });

  it('melhor de 3: 6×4, 3×6 → incompleto (1×1) → inválido', () => {
    expect(computeMatchWinner([{ a: 6, b: 4 }, { a: 3, b: 6 }], bestOf3, 'A', 'B').valid).toBe(false);
  });

  it('sets além do formato → inválido', () => {
    expect(computeMatchWinner([{ a: 6, b: 4 }, { a: 6, b: 4 }], oneSet, 'A', 'B').valid).toBe(false);
  });
});

describe('RegisterMatchResultSchema', () => {
  it('aceita placar em sets', () => {
    expect(RegisterMatchResultSchema.safeParse({ sets: [{ a: 6, b: 3 }] }).success).toBe(true);
  });

  it('aceita W.O.', () => {
    const parsed = RegisterMatchResultSchema.safeParse({
      walkover: { winnerTeamId: '00000000-0000-0000-0000-000000000001', injury: true },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita sets e W.O. juntos', () => {
    const parsed = RegisterMatchResultSchema.safeParse({
      sets: [{ a: 6, b: 3 }],
      walkover: { winnerTeamId: '00000000-0000-0000-0000-000000000001' },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita vazio', () => {
    expect(RegisterMatchResultSchema.safeParse({}).success).toBe(false);
  });
});

describe('computeGroupStandings (BR-28/29)', () => {
  const teams: StandingTeam[] = [
    { teamId: 'A', label: 'Dupla 1', playerNames: ['a1', 'a2'], seed: 0 },
    { teamId: 'B', label: 'Dupla 2', playerNames: ['b1', 'b2'], seed: 1 },
    { teamId: 'C', label: 'Dupla 3', playerNames: ['c1', 'c2'], seed: 2 },
  ];

  it('ordena por vitórias', () => {
    const matches: StandingMatch[] = [
      { teamAId: 'A', teamBId: 'B', sets: [{ a: 6, b: 2 }], winnerTeamId: 'A', status: 'PLAYED' },
      { teamAId: 'A', teamBId: 'C', sets: [{ a: 6, b: 1 }], winnerTeamId: 'A', status: 'PLAYED' },
      { teamAId: 'B', teamBId: 'C', sets: [{ a: 6, b: 4 }], winnerTeamId: 'B', status: 'PLAYED' },
    ];
    const s = computeGroupStandings(matches, teams);
    expect(s.map((x) => x.teamId)).toEqual(['A', 'B', 'C']);
    expect(s[0]!.wins).toBe(2);
    expect(s[0]!.position).toBe(1);
  });

  it('desempata por confronto direto quando vitórias e saldo empatam', () => {
    // A>B, B>C, C>A: todos 1 vitória. Saldos iguais (cada um +? ) → cai no confronto direto entre pares.
    const matches: StandingMatch[] = [
      { teamAId: 'A', teamBId: 'B', sets: [{ a: 6, b: 4 }], winnerTeamId: 'A', status: 'PLAYED' },
      { teamAId: 'B', teamBId: 'C', sets: [{ a: 6, b: 4 }], winnerTeamId: 'B', status: 'PLAYED' },
      { teamAId: 'C', teamBId: 'A', sets: [{ a: 6, b: 4 }], winnerTeamId: 'C', status: 'PLAYED' },
    ];
    const s = computeGroupStandings(matches, teams);
    // Todos com 1 vitória e saldo 0 → ordem estável por seed (A,B,C).
    expect(s.every((x) => x.wins === 1)).toBe(true);
    expect(s.map((x) => x.teamId)).toEqual(['A', 'B', 'C']);
  });

  it('W.O. conta como vitória (6/0) e jogos PENDING são ignorados', () => {
    const matches: StandingMatch[] = [
      { teamAId: 'A', teamBId: 'B', sets: [{ a: 6, b: 0 }], winnerTeamId: 'A', status: 'WALKOVER' },
      { teamAId: 'A', teamBId: 'C', sets: null, winnerTeamId: null, status: 'PENDING' },
    ];
    const s = computeGroupStandings(matches, teams);
    const a = s.find((x) => x.teamId === 'A')!;
    expect(a.wins).toBe(1);
    expect(a.gamesFor).toBe(6);
    expect(a.played).toBe(1);
  });
});
