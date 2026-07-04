import { pairKey, type DrawMetrics } from '@reb/contracts';
import type { PlayerNode, Pair } from './pairing';
import { countRepeatedOpponents, type TeamInfo } from './grouping';

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeMetrics(
  teams: Pair[],
  teamInfos: TeamInfo[],
  groups: number[][],
  nodes: PlayerNode[],
  partnerHistory: Map<string, number>,
  opponentHistory: Map<string, number>,
): DrawMetrics {
  const teamCount = teams.length;

  let repeatedPartners = 0;
  let sumRankingDiff = 0;
  for (const [i, j] of teams) {
    const a = nodes[i]!;
    const b = nodes[j]!;
    if ((partnerHistory.get(pairKey(a.id, b.id)) ?? 0) > 0) repeatedPartners++;
    sumRankingDiff += Math.abs(a.strength - b.strength);
  }

  const repeatedOpponents = countRepeatedOpponents(groups, teamInfos, nodes, opponentHistory);

  const groupSums = groups.map((g) => g.reduce((acc, ti) => acc + teamInfos[ti]!.strength, 0));
  const groupBalance = Number(stdDev(groupSums).toFixed(2));

  const avgRankingDiff = teamCount > 0 ? Number((sumRankingDiff / teamCount).toFixed(1)) : 0;
  const inedita = teamCount - repeatedPartners;
  const partnerDiversity = teamCount > 0 ? Number(((inedita / teamCount) * 100).toFixed(1)) : 100;

  return { repeatedPartners, repeatedOpponents, groupBalance, avgRankingDiff, partnerDiversity };
}

/** Score de qualidade 0..100 (maior = melhor) — SORT_ENGINE §8. */
export function computeQualityScore(
  metrics: DrawMetrics,
  teamCount: number,
  totalMatchups: number,
  groupSums: number[],
): number {
  const partnerRepeatRate = teamCount > 0 ? metrics.repeatedPartners / teamCount : 0;
  const oppRepeatRate = totalMatchups > 0 ? metrics.repeatedOpponents / totalMatchups : 0;

  const meanSum = groupSums.length ? groupSums.reduce((a, b) => a + b, 0) / groupSums.length : 0;
  const balancePenalty = meanSum > 0 ? clamp(metrics.groupBalance / meanSum, 0, 1) : 0;

  const diversity = metrics.partnerDiversity / 100;
  const complement = clamp(metrics.avgRankingDiff / 100, 0, 1);

  const quality =
    0.35 * (1 - partnerRepeatRate) +
    0.2 * (1 - oppRepeatRate) +
    0.2 * (1 - balancePenalty) +
    0.15 * diversity +
    0.1 * complement;

  return Number((clamp(quality, 0, 1) * 100).toFixed(1));
}
