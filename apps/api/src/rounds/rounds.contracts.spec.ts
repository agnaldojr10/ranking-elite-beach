import { describe, expect, it } from 'vitest';
import {
  CreateRegistrationSchema,
  CreateRoundSchema,
  DEFAULT_MATCH_FORMAT,
  MatchFormatSchema,
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

describe('describeRoundFormat (FORMATS.md)', () => {
  it('4 duplas → 1 grupo, Final', () => {
    const f = describeRoundFormat(4);
    expect(f.groupCount).toBe(1);
    expect(f.bracketLabel).toBe('Final');
    expect(f.qualifiers).toBe(2);
  });

  it('6 duplas → 2 grupos, Semifinal', () => {
    const f = describeRoundFormat(6);
    expect(f.groupCount).toBe(2);
    expect(f.bracketSize).toBe(4);
  });

  it('9 duplas → 3 grupos, chave 4, 3 venc. + 1 melhor 2º', () => {
    const f = describeRoundFormat(9);
    expect(f.groupCount).toBe(3);
    expect(f.bracketSize).toBe(4);
    expect(f.groupWinners).toBe(3);
    expect(f.bestRunnersUp).toBe(1);
  });

  it('16 duplas → chave 8 (Quartas)', () => {
    const f = describeRoundFormat(16);
    expect(f.bracketSize).toBe(8);
    expect(f.bracketLabel).toBe('Quartas de final');
  });
});
