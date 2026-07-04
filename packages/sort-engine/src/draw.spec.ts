import { describe, expect, it } from 'vitest';
import {
  DrawResultSchema,
  pairKey,
  type DrawConfig,
  type DrawInput,
  type DrawPlayerInput,
  type SkillLevel,
} from '@reb/contracts';
import { runDraw, DrawError, mulberry32, rngFromSeed } from './index';

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];

function makePlayers(n: number): DrawPlayerInput[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Jogador ${i + 1}`,
    strength: 10 + ((i * 13) % 90), // espalhado 10..99, determinístico
    skillLevel: LEVELS[i % 4]!,
  }));
}

const baseConfig: DrawConfig = {
  weights: { ranking: 0.35, skill: 0.15, partner: 0.35, opponent: 0.15 },
  randomness: 100,
  allowRepeatPartners: false,
  allowRepeatOpponents: true,
  groupSizePreference: 3,
};

function makeInput(n: number, over: Partial<DrawInput> = {}): DrawInput {
  return {
    players: makePlayers(n),
    partnerHistory: new Map(),
    opponentHistory: new Map(),
    config: baseConfig,
    seed: 'seed-fixa',
    ...over,
  };
}

describe('prng determinístico', () => {
  it('mulberry32 reproduz a mesma sequência por seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('rngFromSeed difere entre seeds distintas', () => {
    expect(rngFromSeed('x')()).not.toBe(rngFromSeed('y')());
  });
});

describe('runDraw — invariantes de integridade', () => {
  for (const n of [8, 16, 32, 64]) {
    it(`${n} jogadores: todo jogador em exatamente 1 dupla, N/2 duplas`, () => {
      const res = runDraw(makeInput(n));
      expect(res.teams).toHaveLength(n / 2);
      const seen = new Set<string>();
      for (const t of res.teams) {
        expect(t.players[0]).not.toBe(t.players[1]);
        seen.add(t.players[0]);
        seen.add(t.players[1]);
      }
      expect(seen.size).toBe(n);
    });

    it(`${n} jogadores: grupos com round-robin completo`, () => {
      const res = runDraw(makeInput(n));
      const expectedMatches = res.groups.reduce(
        (acc, g) => acc + (g.teamIds.length * (g.teamIds.length - 1)) / 2,
        0,
      );
      expect(res.matches).toHaveLength(expectedMatches);
      // todas as duplas estão em exatamente um grupo
      const inGroups = res.groups.flatMap((g) => g.teamIds);
      expect(new Set(inGroups).size).toBe(res.teams.length);
    });

    it(`${n} jogadores: score em [0,100] e schema válido`, () => {
      const res = runDraw(makeInput(n));
      expect(res.qualityScore).toBeGreaterThanOrEqual(0);
      expect(res.qualityScore).toBeLessThanOrEqual(100);
      expect(DrawResultSchema.safeParse(res).success).toBe(true);
    });
  }
});

describe('runDraw — determinismo', () => {
  it('mesma seed ⇒ resultado idêntico', () => {
    const a = runDraw(makeInput(16));
    const b = runDraw(makeInput(16));
    expect(a).toEqual(b);
  });

  it('seeds diferentes ⇒ normalmente divergem', () => {
    const a = runDraw(makeInput(16, { seed: 'aaa', config: { ...baseConfig, randomness: 50 } }));
    const b = runDraw(makeInput(16, { seed: 'bbb', config: { ...baseConfig, randomness: 50 } }));
    const pa = a.teams.map((t) => t.players.join('-')).sort();
    const pb = b.teams.map((t) => t.players.join('-')).sort();
    expect(pa).not.toEqual(pb);
  });
});

describe('runDraw — histórico e repetição de parceiros', () => {
  it('histórico denso com allowRepeatPartners=false não trava e aplica fallback', () => {
    const players = makePlayers(8);
    // Torna TODOS os pares já vistos (saturado) → repetição inevitável.
    const partnerHistory = new Map<string, number>();
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        partnerHistory.set(pairKey(players[i]!.id, players[j]!.id), 3);
      }
    }
    const res = runDraw(makeInput(8, { players, partnerHistory }));
    expect(res.teams).toHaveLength(4);
    // com histórico saturado, diversidade cai (há repetições)
    expect(res.metrics.partnerDiversity).toBeLessThan(100);
  });

  it('sem histórico ⇒ diversidade 100% e nenhum parceiro repetido', () => {
    const res = runDraw(makeInput(16));
    expect(res.metrics.repeatedPartners).toBe(0);
    expect(res.metrics.partnerDiversity).toBe(100);
  });
});

describe('runDraw — validação de entrada', () => {
  it('nº ímpar → DrawError ODD_PLAYER_COUNT', () => {
    expect(() => runDraw(makeInput(9))).toThrowError(DrawError);
    try {
      runDraw(makeInput(9));
    } catch (e) {
      expect((e as DrawError).code).toBe('ODD_PLAYER_COUNT');
    }
  });

  it('menos de 8 → PLAYER_COUNT_OUT_OF_RANGE', () => {
    try {
      runDraw(makeInput(6));
    } catch (e) {
      expect((e as DrawError).code).toBe('PLAYER_COUNT_OUT_OF_RANGE');
    }
  });
});

describe('runDraw — randomness 0 (aleatório) vs 100 (otimizado)', () => {
  it('randomness 100 alcança score >= randomness 0 (mesma seed)', () => {
    const opt = runDraw(makeInput(16, { config: { ...baseConfig, randomness: 100 } }));
    const rnd = runDraw(makeInput(16, { config: { ...baseConfig, randomness: 0 } }));
    expect(opt.qualityScore).toBeGreaterThanOrEqual(rnd.qualityScore);
  });
});
