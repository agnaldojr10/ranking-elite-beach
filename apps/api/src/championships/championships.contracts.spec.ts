import { describe, expect, it } from 'vitest';
import {
  CreateChampionshipSchema,
  DEFAULT_CHAMPIONSHIP_CONFIG,
  STRUCTURAL_CONFIG_KEYS,
  UpdateChampionshipConfigSchema,
} from '@reb/contracts';

describe('CreateChampionshipSchema', () => {
  it('aceita campeonato válido', () => {
    const parsed = CreateChampionshipSchema.safeParse({
      seasonId: '00000000-0000-0000-0000-000000000001',
      name: 'Campeonato Quinta',
      roundsCount: 10,
      qualifiersCount: 8,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita classificados < 2', () => {
    const parsed = CreateChampionshipSchema.safeParse({
      seasonId: '00000000-0000-0000-0000-000000000001',
      name: 'X',
      roundsCount: 10,
      qualifiersCount: 1,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('Config padrão e desempate (BR-29)', () => {
  it('desempate padrão começa por pontos', () => {
    expect(DEFAULT_CHAMPIONSHIP_CONFIG.tiebreakers[0]).toBe('POINTS');
  });

  it('pesos do sorteio somam próximo de 1', () => {
    const w = DEFAULT_CHAMPIONSHIP_CONFIG.drawWeights;
    const sum = w.ranking + w.skill + w.partner + w.opponent;
    expect(sum).toBeCloseTo(1, 5);
  });

  it('chaves estruturais incluem pontuação, desempate e final', () => {
    expect(STRUCTURAL_CONFIG_KEYS).toContain('scoringTable');
    expect(STRUCTURAL_CONFIG_KEYS).toContain('tiebreakers');
    expect(STRUCTURAL_CONFIG_KEYS).toContain('finalConfig');
  });
});

describe('UpdateChampionshipConfigSchema', () => {
  it('aceita atualização parcial só de pesos', () => {
    const parsed = UpdateChampionshipConfigSchema.safeParse({
      drawWeights: { ranking: 0.5, skill: 0.2, partner: 0.2, opponent: 0.1 },
      randomness: 70,
      allowRepeatPartners: false,
      allowRepeatOpponents: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita peso fora de 0..1', () => {
    const parsed = UpdateChampionshipConfigSchema.safeParse({
      drawWeights: { ranking: 2, skill: 0, partner: 0, opponent: 0 },
    });
    expect(parsed.success).toBe(false);
  });
});
