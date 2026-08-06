import { describe, expect, it } from 'vitest';
import {
  CreateRegistrationSchema,
  CreateRoundSchema,
  DEFAULT_MATCH_FORMAT,
  PairDrawPlayersSchema,
  MatchFormatSchema,
  RecordClassificationSchema,
  buildClassificationTeams,
  buildDrawReport,
  buildRoundReport,
  computeRoundReadiness,
  describeRoundFormat,
  partitionGroups,
} from '@reb/contracts';

describe('Formato de partida (BR-26)', () => {
  it('default é 1 set', () => {
    expect(DEFAULT_MATCH_FORMAT.sets).toBe(1);
  });

  it('MatchFormatSchema aplica defaults ao objeto vazio', () => {
    const f = MatchFormatSchema.parse({});
    expect(f).toEqual(DEFAULT_MATCH_FORMAT);
  });

  it('rejeita nº de sets diferente de 1 ou 3', () => {
    expect(MatchFormatSchema.safeParse({ sets: 2 }).success).toBe(false);
  });
});

describe('CreateRoundSchema', () => {
  it('aceita rodada sem número (auto) com defaults', () => {
    const parsed = CreateRoundSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe('REGULAR');
      expect(parsed.data.groupSizePref).toBe(3);
    }
  });

  it('rejeita preferência de grupo fora de 3..4', () => {
    expect(CreateRoundSchema.safeParse({ groupSizePref: 5 }).success).toBe(false);
  });
});

describe('CreateRegistrationSchema', () => {
  it('aceita playerId válido e assume CONFIRMED', () => {
    const parsed = CreateRegistrationSchema.safeParse({
      playerId: '00000000-0000-0000-0000-000000000001',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.status).toBe('CONFIRMED');
  });

  it('rejeita playerId não-uuid', () => {
    expect(CreateRegistrationSchema.safeParse({ playerId: 'x' }).success).toBe(false);
  });
});

describe('computeRoundReadiness (BR-07/08/11)', () => {
  it('8 confirmados → pode sortear', () => {
    expect(computeRoundReadiness(8).canDraw).toBe(true);
  });

  it('64 confirmados → pode sortear', () => {
    expect(computeRoundReadiness(64).canDraw).toBe(true);
  });

  it('7 confirmados → fora de faixa', () => {
    const r = computeRoundReadiness(7);
    expect(r.canDraw).toBe(false);
    expect(r.code).toBe('PLAYER_COUNT_OUT_OF_RANGE');
  });

  it('65 confirmados → fora de faixa', () => {
    expect(computeRoundReadiness(65).code).toBe('PLAYER_COUNT_OUT_OF_RANGE');
  });

  it('9 confirmados (ímpar) → bloqueio por paridade', () => {
    const r = computeRoundReadiness(9);
    expect(r.canDraw).toBe(false);
    expect(r.code).toBe('ODD_PLAYER_COUNT');
  });
});

describe('partitionGroups (BR-23 / FORMATS.md)', () => {
  it('preferência 3 particiona corretamente', () => {
    expect(partitionGroups(4)).toEqual([4]); // 8 jogadores → 1 grupo
    expect(partitionGroups(5)).toEqual([5]); // 10 jogadores → grupo único de 5
    expect(partitionGroups(6)).toEqual([3, 3]);
    expect(partitionGroups(7)).toEqual([3, 4]);
    expect(partitionGroups(8)).toEqual([4, 4]);
    expect(partitionGroups(9)).toEqual([3, 3, 3]);
    expect(partitionGroups(16)).toEqual([3, 3, 3, 3, 4]);
  });

  it('todas as duplas são alocadas (soma preserva o total)', () => {
    for (let d = 4; d <= 32; d++) {
      const sum = partitionGroups(d).reduce((a, b) => a + b, 0);
      expect(sum).toBe(d);
    }
  });
});

describe('describeRoundFormat (classificação flexível — Fase 14)', () => {
  it('4 duplas (8 jogadores) → 4 classificados, Semifinal direta', () => {
    const f = describeRoundFormat(4);
    expect(f.groupCount).toBe(1);
    expect(f.qualifiers).toBe(4);
    expect(f.bracketLabel).toBe('Semifinal');
  });

  it('5 duplas → 4 classificados, Semifinal', () => {
    const f = describeRoundFormat(5);
    expect(f.qualifiers).toBe(4);
    expect(f.bracketSize).toBe(4);
  });

  it('6 duplas (2 grupos) → 4 classificados (2 de cada grupo, semifinal)', () => {
    const f = describeRoundFormat(6);
    expect(f.groupCount).toBe(2);
    expect(f.qualifiers).toBe(4);
    expect(f.bracketLabel).toBe('Semifinal');
  });

  it('9 duplas (18 jogadores, 3 grupos) → 6 classificados (2 byes + quartas)', () => {
    const f = describeRoundFormat(9);
    expect(f.groupCount).toBe(3);
    expect(f.qualifiers).toBe(6);
    expect(f.bracketSize).toBe(6);
  });

  it('8 duplas (16 jogadores, 2 grupos) → 4 classificados (semifinal cruzada)', () => {
    const f = describeRoundFormat(8);
    expect(f.groupCount).toBe(2);
    expect(f.qualifiers).toBe(4);
    expect(f.bracketLabel).toBe('Semifinal');
  });
});

describe('buildRoundReport (texto para WhatsApp)', () => {
  it('inclui colocação (com medalhas) e ranking, data em DD/MM/AAAA', () => {
    const text = buildRoundReport({
      championshipName: 'Ranking Elite Beach Tennis',
      roundLabel: 'Rodada 5',
      date: '2026-07-10',
      results: [
        { playerNames: ['Éberson', 'Yan'], finalPosition: 1, pointsAwarded: 100 },
        { playerNames: ['Luis', 'Mateus'], finalPosition: 2, pointsAwarded: 70 },
        { playerNames: ['Fabiano', 'Lucas'], finalPosition: 3, pointsAwarded: 50 },
      ],
      ranking: [
        { playerName: 'Éberson', points: 250 },
        { playerName: 'Yan', points: 240 },
      ],
    });
    expect(text).toContain('Ranking Elite Beach Tennis');
    expect(text).toContain('Rodada 5 — 10/07/2026');
    expect(text).toContain('🥇 Éberson & Yan — 100 pts');
    expect(text).toContain('🥉 Fabiano & Lucas — 50 pts');
    expect(text).toContain('1. Éberson — 250 pts');
  });

  it('sem resultado final avisa que a rodada está em andamento', () => {
    const text = buildRoundReport({
      championshipName: 'X',
      roundLabel: 'Rodada 1',
      date: null,
      results: [],
      ranking: [{ playerName: 'A', points: 10 }],
    });
    expect(text).toContain('em andamento');
    expect(text).toContain('1. A — 10 pts');
  });

  it('limita o ranking e sinaliza os demais', () => {
    const ranking = Array.from({ length: 12 }, (_, i) => ({ playerName: `P${i}`, points: 12 - i }));
    const text = buildRoundReport({
      championshipName: 'X',
      roundLabel: 'R',
      date: null,
      results: [],
      ranking,
      rankingLimit: 10,
    });
    expect(text).toContain('… e mais 2.');
  });
});

describe('PairDrawPlayersSchema (editar dupla)', () => {
  const A = '00000000-0000-0000-0000-000000000001';
  const B = '00000000-0000-0000-0000-000000000002';
  it('aceita dois jogadores diferentes', () => {
    expect(PairDrawPlayersSchema.safeParse({ playerAId: A, playerBId: B }).success).toBe(true);
  });
  it('rejeita o mesmo jogador nos dois', () => {
    expect(PairDrawPlayersSchema.safeParse({ playerAId: A, playerBId: A }).success).toBe(false);
  });
});

describe('buildDrawReport (texto do sorteio para WhatsApp)', () => {
  it('lista grupos e duplas', () => {
    const text = buildDrawReport({
      championshipName: 'Ranking Elite Beach Tennis',
      roundLabel: 'Rodada 6',
      date: '2026-07-24',
      groups: [
        { name: 'A', pairs: [['Éberson', 'Yan'], ['Mateus', 'Igor']] },
        { name: 'B', pairs: [['Fabiano', 'Lucas']] },
      ],
    });
    expect(text).toContain('Rodada 6 — 24/07/2026 · Sorteio das duplas');
    expect(text).toContain('📋 Grupo A');
    expect(text).toContain('• Éberson & Yan');
    expect(text).toContain('📋 Grupo B');
    expect(text).toContain('• Fabiano & Lucas');
  });

  it('avisa quando ainda não há grupos', () => {
    const text = buildDrawReport({
      championshipName: 'X',
      roundLabel: 'Rodada 1',
      date: null,
      groups: [],
    });
    expect(text).toContain('não confirmado');
  });
});

describe('buildClassificationTeams (lançamento por classificação)', () => {
  const P = (n: number) => `00000000-0000-0000-0000-0000000000${String(n).padStart(2, '0')}`;

  it('pódio nas posições 1..k e restantes pareados a seguir', () => {
    const participants = [P(1), P(2), P(3), P(4), P(5), P(6)];
    const podium = [
      { playerIds: [P(1), P(2)] as [string, string] },
      { playerIds: [P(3), P(4)] as [string, string] },
    ];
    const teams = buildClassificationTeams(participants, podium);
    expect(teams).toEqual([
      { playerIds: [P(1), P(2)], position: 1 },
      { playerIds: [P(3), P(4)], position: 2 },
      { playerIds: [P(5), P(6)], position: 3 },
    ]);
  });

  it('jogador do pódio não repete na participação; sobra ímpar vira dupla de 1', () => {
    const participants = [P(1), P(2), P(3), P(4), P(5)];
    const podium = [{ playerIds: [P(1), P(2)] as [string, string] }];
    const teams = buildClassificationTeams(participants, podium);
    expect(teams).toEqual([
      { playerIds: [P(1), P(2)], position: 1 },
      { playerIds: [P(3), P(4)], position: 2 },
      { playerIds: [P(5)], position: 3 },
    ]);
  });

  it('schema rejeita jogador do pódio fora dos participantes', () => {
    const r = RecordClassificationSchema.safeParse({
      participantIds: [P(1), P(2)],
      podium: [{ playerIds: [P(1), P(9)] }],
    });
    expect(r.success).toBe(false);
  });
});
