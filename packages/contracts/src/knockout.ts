import { z } from 'zod';
import type { ScoringTable } from './championship';
import { MatchStatusSchema } from './draw';
import { MatchTeamRefSchema, SetScoreSchema, type GroupStandings } from './match';

// ---------------------------------------------------------------------------
// Rótulos de fase
// ---------------------------------------------------------------------------
export const STAGE_LABELS: Record<string, string> = {
  F: 'Final',
  SF: 'Semifinal',
  QF: 'Quartas de final',
  R16: 'Oitavas de final',
  R32: 'Dezesseis avos',
  '3P': 'Disputa de 3º lugar',
};

/** Nº de duplas numa fase → código da fase. */
export function stageCode(teamsInStage: number): string {
  switch (teamsInStage) {
    case 2:
      return 'F';
    case 4:
      return 'SF';
    case 8:
      return 'QF';
    case 16:
      return 'R16';
    case 32:
      return 'R32';
    default:
      return `R${teamsInStage}`;
  }
}

// ---------------------------------------------------------------------------
// Classificados e chaveamento
// ---------------------------------------------------------------------------
export type Qualifier = {
  teamId: string;
  seedRank: number; // 1 = melhor (ranking global)
  groupName: string;
  groupPosition: number;
};

export type Pairing = { slot: number; teamAId: string; teamBId: string };

// ---------------------------------------------------------------------------
// Classificação flexível por nº de duplas (Fase 14) — automática, sem config.
//
//   D ≥ 6  → 6 classificados: as 2 melhores vão DIRETO à semifinal (bye) e a
//            3ª–6ª disputam as quartas (2 vagas). Ex.: 18 jogadores (9 duplas,
//            3 grupos de 3), 16 (2×4), 12 (2×3). 7º+ eliminados por desempenho.
//   D = 4-5 → 4 classificados: semifinal direta (1×4, 2×3) → Final + 3º.
//   D = 2-3 → 2 classificados: Final direta (1×2); 3º pela classificação.
//
// O ranqueamento é GLOBAL por vitórias → saldo de games (não por grupo), e as
// quartas evitam revanche de grupo (invertem os pares quando possível).
// ---------------------------------------------------------------------------
export type KnockoutFormat = 'FINAL' | 'SEMI' | 'QUARTER_WITH_BYES';

export type KnockoutPlan = {
  format: KnockoutFormat;
  /** Classificados já ordenados por seed global (1 = melhor). */
  qualifiers: Qualifier[];
  /** Quantos avançam ao mata-mata (2, 4 ou 6). */
  qualifierCount: number;
  /** Duplas que vão direto à semifinal (só em QUARTER_WITH_BYES): [seed1, seed2]. */
  byes: string[];
  /** Primeira fase a ser criada: 'F' | 'SF' | 'QF'. */
  firstStage: string;
  firstPairings: Pairing[];
};

/** Ranqueia TODAS as duplas globalmente por vitórias → saldo de games. */
export function globalRank(
  groupStandings: GroupStandings[],
): { teamId: string; groupName: string }[] {
  return groupStandings
    .flatMap((g) => g.standings.map((s) => ({ s, groupName: g.groupName })))
    .sort((x, y) => y.s.wins - x.s.wins || y.s.gamesBalance - x.s.gamesBalance)
    .map(({ s, groupName }) => ({ teamId: s.teamId, groupName }));
}

/**
 * Monta o plano do mata-mata a partir das classificações de grupo, de forma
 * automática pelo nº de duplas. Ver descrição do bloco acima.
 */
export function planKnockout(groupStandings: GroupStandings[]): KnockoutPlan {
  const ranked = globalRank(groupStandings);
  const groupOf = new Map(ranked.map((r) => [r.teamId, r.groupName]));
  const met = (a: string, b: string) => !!a && !!b && groupOf.get(a) === groupOf.get(b);
  const mkQual = (ids: string[]): Qualifier[] =>
    ids.map((teamId, i) => ({
      teamId,
      seedRank: i + 1,
      groupName: groupOf.get(teamId) ?? '',
      groupPosition: 0,
    }));
  const D = ranked.length;

  if (D >= 6) {
    const [s1, s2, s3, s4, s5, s6] = ranked.slice(0, 6).map((r) => r.teamId) as [
      string, string, string, string, string, string,
    ];
    // Pares default (4×5, 3×6) x alternativo (4×6, 3×5): escolhe o de menos revanches.
    const def: [string, string][] = [[s4, s5], [s3, s6]];
    const alt: [string, string][] = [[s4, s6], [s3, s5]];
    const rematches = (ps: [string, string][]) => ps.filter(([a, b]) => met(a, b)).length;
    const pairs = rematches(alt) < rematches(def) ? alt : def;
    // O par com o seed4 enfrenta o bye seed1 (SF slot 0); o com seed3 enfrenta seed2 (slot 1).
    const slot0 = pairs.find((p) => p.includes(s4))!;
    const slot1 = pairs.find((p) => p.includes(s3))!;
    const firstPairings: Pairing[] = [
      { slot: 0, teamAId: slot0[0], teamBId: slot0[1] },
      { slot: 1, teamAId: slot1[0], teamBId: slot1[1] },
    ];
    return {
      format: 'QUARTER_WITH_BYES',
      qualifiers: mkQual([s1, s2, s3, s4, s5, s6]),
      qualifierCount: 6,
      byes: [s1, s2],
      firstStage: 'QF',
      firstPairings,
    };
  }

  if (D >= 4) {
    const [q1, q2, q3, q4] = ranked.slice(0, 4).map((r) => r.teamId) as [
      string, string, string, string,
    ];
    return {
      format: 'SEMI',
      qualifiers: mkQual([q1, q2, q3, q4]),
      qualifierCount: 4,
      byes: [],
      firstStage: 'SF',
      firstPairings: [
        { slot: 0, teamAId: q1, teamBId: q4 },
        { slot: 1, teamAId: q2, teamBId: q3 },
      ],
    };
  }

  const top2 = ranked.slice(0, 2).map((r) => r.teamId);
  return {
    format: 'FINAL',
    qualifiers: mkQual(top2),
    qualifierCount: top2.length,
    byes: [],
    firstStage: 'F',
    firstPairings:
      top2.length === 2 ? [{ slot: 0, teamAId: top2[0]!, teamBId: top2[1]! }] : [],
  };
}

/** Ordem padrão de seeds numa chave (1,8,4,5,2,7,3,6 para 8). */
export function seedOrder(bracketSize: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < bracketSize) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

/** Pareia os vencedores da fase concluída (em ordem de slot) para a próxima fase. */
export function nextStagePairings(winnerTeamIdsInSlotOrder: string[]): Pairing[] {
  const pairings: Pairing[] = [];
  for (let i = 0; i < winnerTeamIdsInSlotOrder.length; i += 2) {
    const a = winnerTeamIdsInSlotOrder[i];
    const b = winnerTeamIdsInSlotOrder[i + 1];
    if (a && b) pairings.push({ slot: i / 2, teamAId: a, teamBId: b });
  }
  return pairings;
}

// ---------------------------------------------------------------------------
// Colocação final e pontos (BR-30)
// ---------------------------------------------------------------------------
export type KnockoutOutcome = { stage: string; winnerTeamId: string; loserTeamId: string };

const STAGE_TEAMS: Record<string, number> = { F: 2, SF: 4, QF: 8, R16: 16, R32: 32 };

/**
 * Colocação final 1..D da rodada. Campeão/vice pela final, 3º/4º pela disputa de 3º,
 * eliminados de fases anteriores e não classificados por desempenho de grupo.
 */
export function computeRoundPlacement(params: {
  knockout: KnockoutOutcome[];
  groupStandings: GroupStandings[];
  bracketSize: number;
}): { teamId: string; position: number }[] {
  const { knockout, groupStandings, bracketSize } = params;

  // Ranking global por desempenho de grupo (vitórias → saldo).
  const groupRankList = [...groupStandings.flatMap((g) => g.standings)].sort(
    (a, b) => b.wins - a.wins || b.gamesBalance - a.gamesBalance,
  );
  const groupRank = new Map(groupRankList.map((s, i) => [s.teamId, i]));
  const byGroup = (ids: string[]) =>
    [...ids].sort((a, b) => (groupRank.get(a) ?? 1e9) - (groupRank.get(b) ?? 1e9));

  const pos = new Map<string, number>();
  const find = (stage: string) => knockout.find((k) => k.stage === stage);

  const final = find('F');
  if (final) {
    pos.set(final.winnerTeamId, 1);
    pos.set(final.loserTeamId, 2);
  }
  const third = find('3P');
  if (third) {
    pos.set(third.winnerTeamId, 3);
    pos.set(third.loserTeamId, 4);
  }

  // Eliminados de fases anteriores à semifinal (QF, R16, ...): bandas 5-8, 9-16, ...
  for (const [stage, teams] of Object.entries(STAGE_TEAMS)) {
    if (stage === 'F' || stage === 'SF') continue;
    const losers = knockout.filter((k) => k.stage === stage).map((k) => k.loserTeamId);
    if (losers.length === 0) continue;
    const bandStart = teams / 2 + 1;
    byGroup(losers).forEach((teamId, i) => {
      if (!pos.has(teamId)) pos.set(teamId, bandStart + i);
    });
  }

  // Não classificados: preenchem bracketSize+1 .. D por desempenho de grupo.
  const allTeams = groupStandings.flatMap((g) => g.standings.map((s) => s.teamId));
  const remaining = byGroup(allTeams.filter((id) => !pos.has(id)));
  let next = bracketSize + 1;
  for (const teamId of remaining) pos.set(teamId, next++);

  return [...pos.entries()]
    .map(([teamId, position]) => ({ teamId, position }))
    .sort((a, b) => a.position - b.position);
}

/**
 * Pontos de uma colocação via scoring_table. Fora da tabela, cai no piso de
 * participação (default 0) — permite "X pontos só por participar".
 */
export function pointsForPlacement(
  scoringTable: ScoringTable,
  position: number,
  participationPoints = 0,
): number {
  return scoringTable[String(position)] ?? participationPoints;
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------
export const KnockoutMatchViewSchema = z.object({
  id: z.string(),
  stage: z.string(),
  stageLabel: z.string(),
  slot: z.number().int(),
  teamA: MatchTeamRefSchema.nullable(),
  teamB: MatchTeamRefSchema.nullable(),
  sets: z.array(SetScoreSchema).nullable(),
  winnerTeamId: z.string().nullable(),
  status: MatchStatusSchema,
  venueId: z.string().nullable(),
  venueName: z.string().nullable(),
  scheduledAt: z.string().nullable(),
});
export type KnockoutMatchView = z.infer<typeof KnockoutMatchViewSchema>;

export const KnockoutViewSchema = z.object({
  bracketSize: z.number().int(),
  generated: z.boolean(),
  matches: z.array(KnockoutMatchViewSchema),
});
export type KnockoutView = z.infer<typeof KnockoutViewSchema>;

export const RoundResultViewSchema = z.object({
  teamId: z.string(),
  label: z.string(),
  playerNames: z.tuple([z.string(), z.string()]),
  finalPosition: z.number().int(),
  pointsAwarded: z.number().int(),
});
export type RoundResultView = z.infer<typeof RoundResultViewSchema>;
