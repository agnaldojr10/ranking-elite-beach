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

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ---------------------------------------------------------------------------
// Classificados e chaveamento (FORMATS.md)
// ---------------------------------------------------------------------------
export type Qualifier = {
  teamId: string;
  seedRank: number; // 1..bracketSize
  groupName: string;
  groupPosition: number;
};

export type Pairing = { slot: number; teamAId: string; teamBId: string };

/** Ranqueia colocados de mesma posição entre grupos por (vitórias → saldo de games). */
function crossRank(
  entries: { teamId: string; wins: number; gamesBalance: number; groupName: string; groupPosition: number }[],
): { teamId: string; groupName: string; groupPosition: number }[] {
  return [...entries]
    .sort((a, b) => b.wins - a.wins || b.gamesBalance - a.gamesBalance)
    .map(({ teamId, groupName, groupPosition }) => ({ teamId, groupName, groupPosition }));
}

/** Tamanho da chave a partir do nº de grupos (BR-23/23b). */
export function bracketSizeForGroups(groupCount: number): number {
  if (groupCount <= 1) return 2;
  if (groupCount === 2) return 4;
  return nextPowerOfTwo(groupCount);
}

/**
 * Seleciona os classificados para o mata-mata (FORMATS.md):
 * G=1 → top-2; G=2 → top-2 de cada; G≥3 → vencedores + melhores 2ºs até fechar a chave.
 * Retorna com `seedRank` 1..bracketSize (vencedores primeiro, depois melhores 2ºs).
 */
export function selectQualifiers(groupStandings: GroupStandings[]): {
  qualifiers: Qualifier[];
  bracketSize: number;
  groupCount: number;
} {
  const groupCount = groupStandings.length;
  const bracketSize = bracketSizeForGroups(groupCount);

  const at = (g: GroupStandings, pos: number) => g.standings.find((s) => s.position === pos);

  if (groupCount <= 1) {
    const g = groupStandings[0];
    const first = g && at(g, 1);
    const second = g && at(g, 2);
    const qualifiers: Qualifier[] = [];
    if (first) qualifiers.push({ teamId: first.teamId, seedRank: 1, groupName: g!.groupName, groupPosition: 1 });
    if (second) qualifiers.push({ teamId: second.teamId, seedRank: 2, groupName: g!.groupName, groupPosition: 2 });
    return { qualifiers, bracketSize, groupCount };
  }

  if (groupCount === 2) {
    const [a, b] = groupStandings;
    const qualifiers: Qualifier[] = [];
    const push = (g: GroupStandings, pos: number, seed: number) => {
      const s = at(g, pos);
      if (s) qualifiers.push({ teamId: s.teamId, seedRank: seed, groupName: g.groupName, groupPosition: pos });
    };
    // seeds só para referência; o pareamento G=2 é cruzado (1A×2B, 1B×2A).
    push(a!, 1, 1);
    push(b!, 1, 2);
    push(a!, 2, 3);
    push(b!, 2, 4);
    return { qualifiers, bracketSize, groupCount };
  }

  // G >= 3: vencedores + melhores 2ºs.
  const winners = crossRank(
    groupStandings
      .map((g) => ({ g, s: at(g, 1) }))
      .filter((x): x is { g: GroupStandings; s: NonNullable<ReturnType<typeof at>> } => Boolean(x.s))
      .map(({ g, s }) => ({ teamId: s.teamId, wins: s.wins, gamesBalance: s.gamesBalance, groupName: g.groupName, groupPosition: 1 })),
  );
  const runnersUp = crossRank(
    groupStandings
      .map((g) => ({ g, s: at(g, 2) }))
      .filter((x): x is { g: GroupStandings; s: NonNullable<ReturnType<typeof at>> } => Boolean(x.s))
      .map(({ g, s }) => ({ teamId: s.teamId, wins: s.wins, gamesBalance: s.gamesBalance, groupName: g.groupName, groupPosition: 2 })),
  );

  const needFromRunners = bracketSize - winners.length;
  const chosen = [...winners, ...runnersUp.slice(0, Math.max(0, needFromRunners))];
  const qualifiers: Qualifier[] = chosen.map((q, i) => ({
    teamId: q.teamId,
    seedRank: i + 1,
    groupName: q.groupName,
    groupPosition: q.groupPosition,
  }));
  return { qualifiers, bracketSize, groupCount };
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

/**
 * Pareamentos da 1ª fase do mata-mata. G=2 usa cruzamento (1ºA×2ºB, 1ºB×2ºA); demais usam
 * seeding padrão (1×B, 2×B-1, …) em ordem de chave (vencedores adjacentes se enfrentam depois).
 */
export function firstRoundPairings(
  qualifiers: Qualifier[],
  bracketSize: number,
  groupCount: number,
): Pairing[] {
  const byId = new Map(qualifiers.map((q) => [q.teamId, q]));
  void byId;

  if (groupCount === 2 && bracketSize === 4) {
    const a1 = qualifiers.find((q) => q.groupPosition === 1 && q.seedRank === 1);
    const b1 = qualifiers.find((q) => q.groupPosition === 1 && q.seedRank === 2);
    const a2 = qualifiers.find((q) => q.groupPosition === 2 && q.seedRank === 3);
    const b2 = qualifiers.find((q) => q.groupPosition === 2 && q.seedRank === 4);
    const pairings: Pairing[] = [];
    if (a1 && b2) pairings.push({ slot: 0, teamAId: a1.teamId, teamBId: b2.teamId });
    if (b1 && a2) pairings.push({ slot: 1, teamAId: b1.teamId, teamBId: a2.teamId });
    return pairings;
  }

  const bySeed = new Map(qualifiers.map((q) => [q.seedRank, q.teamId]));
  const order = seedOrder(bracketSize); // posições de chave, tamanho = bracketSize
  const pairings: Pairing[] = [];
  for (let i = 0; i < order.length; i += 2) {
    const a = bySeed.get(order[i]!);
    const b = bySeed.get(order[i + 1]!);
    if (a && b) pairings.push({ slot: i / 2, teamAId: a, teamBId: b });
  }
  return pairings;
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
