import {
  describeRoundFormat,
  partitionGroups,
  pairKey,
  type DrawGroup,
  type DrawInput,
  type DrawMatch,
  type DrawResult,
  type DrawTeam,
} from '@reb/contracts';
import { rngFromSeed, shuffle, type Rng } from './prng';
import {
  buildCostFn,
  greedyPairing,
  toNodes,
  totalCost,
  twoOpt,
  type CostTerms,
  type Pair,
  type PlayerNode,
} from './pairing';
import { buildTeamInfos, groupTeams } from './grouping';
import { buildRoundRobin, groupName } from './round-robin';
import { computeMetrics, computeQualityScore } from './metrics';
import { generateExplanations, type TeamExplainInput } from './explain';

/** Máximo de reinícios aleatórios com randomness=100. */
const MAX_ATTEMPTS = 40;

export class DrawError extends Error {
  constructor(
    public code: 'ODD_PLAYER_COUNT' | 'PLAYER_COUNT_OUT_OF_RANGE',
    message: string,
  ) {
    super(message);
    this.name = 'DrawError';
  }
}

function validate(input: DrawInput): void {
  const n = input.players.length;
  if (n < 8 || n > 64) {
    throw new DrawError('PLAYER_COUNT_OUT_OF_RANGE', `Nº de jogadores fora de [8,64]: ${n}`);
  }
  if (n % 2 !== 0) {
    throw new DrawError('ODD_PLAYER_COUNT', `Nº de jogadores deve ser par: ${n}`);
  }
}

/** Emparelhamento aleatório puro (randomness=0): embaralha e forma duplas sequenciais. */
function randomPairing(nodes: PlayerNode[], rng: Rng): Pair[] {
  const idx = shuffle(rng, nodes.map((n) => n.index));
  const teams: Pair[] = [];
  for (let k = 0; k + 1 < idx.length; k += 2) teams.push([idx[k]!, idx[k + 1]!]);
  return teams;
}

/** Escolhe as duplas conforme o grau de aleatoriedade (SORT_ENGINE §7). */
function selectTeams(
  nodes: PlayerNode[],
  cost: (i: number, j: number) => CostTerms,
  rng: Rng,
  randomness: number,
): Pair[] {
  if (randomness <= 0) return randomPairing(nodes, rng);

  const jitter = randomness / 100;
  const attempts = 1 + Math.round(jitter * MAX_ATTEMPTS);
  let best: Pair[] | null = null;
  let bestCost = Infinity;
  for (let k = 0; k < attempts; k++) {
    // 1ª tentativa é greedy puro; as demais recebem ruído proporcional ao randomness.
    const teams = twoOpt(greedyPairing(nodes, cost, rng, k === 0 ? 0 : jitter), cost);
    const c = totalCost(teams, cost);
    if (c < bestCost) {
      bestCost = c;
      best = teams;
    }
  }
  return best!;
}

export function runDraw(input: DrawInput): DrawResult {
  validate(input);
  const { players, partnerHistory, opponentHistory, config, seed } = input;

  const nodes = toNodes(players);
  const rng = rngFromSeed(seed);
  const cost = buildCostFn(nodes, partnerHistory, config);

  // Fase 1 — emparelhamento.
  const pairs = selectTeams(nodes, cost, rng, config.randomness);

  // Monta as duplas (DTO) com labels/força.
  const teams: DrawTeam[] = pairs.map((p, k) => {
    const a = nodes[p[0]]!;
    const b = nodes[p[1]]!;
    return {
      id: `t${k + 1}`,
      label: `Dupla ${k + 1}`,
      players: [a.id, b.id],
      playerNames: [a.name, b.name],
      strength: a.strength + b.strength,
    };
  });

  // Fase 2 — agrupamento.
  const teamInfos = buildTeamInfos(pairs, nodes);
  const sizes = partitionGroups(pairs.length, config.groupSizePreference);
  const groupIdx = groupTeams(teamInfos, nodes, sizes, opponentHistory, config);
  const groups: DrawGroup[] = groupIdx.map((teamIndexes, g) => ({
    name: groupName(g),
    teamIds: teamIndexes.map((ti) => teams[ti]!.id),
  }));

  // Fase 3 — confrontos.
  const matches: DrawMatch[] = buildRoundRobin(groups.map((g) => g.teamIds));

  // Métricas + score.
  const metrics = computeMetrics(pairs, teamInfos, groupIdx, nodes, partnerHistory, opponentHistory);
  const groupSums = groupIdx.map((g) => g.reduce((acc, ti) => acc + teamInfos[ti]!.strength, 0));
  const qualityScore = computeQualityScore(metrics, pairs.length, matches.length, groupSums);

  // Explicações.
  const explainInput: TeamExplainInput[] = pairs.map((p, k) => {
    const a = nodes[p[0]]!;
    const b = nodes[p[1]]!;
    return {
      label: teams[k]!.label,
      aName: a.name,
      bName: b.name,
      aStrength: a.strength,
      bStrength: b.strength,
      timesTogether: partnerHistory.get(pairKey(a.id, b.id)) ?? 0,
    };
  });
  const explanations = generateExplanations(explainInput, metrics, config.allowRepeatPartners);

  const format = describeRoundFormat(pairs.length, config.groupSizePreference);

  return { seed, teams, groups, matches, qualityScore, metrics, explanations, format };
}
