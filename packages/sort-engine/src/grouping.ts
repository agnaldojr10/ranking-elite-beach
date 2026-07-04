import { pairKey, type DrawConfig } from '@reb/contracts';
import type { PlayerNode, Pair } from './pairing';

export type TeamInfo = {
  index: number; // índice em `teams`
  players: Pair;
  strength: number;
};

export function buildTeamInfos(teams: Pair[], nodes: PlayerNode[]): TeamInfo[] {
  return teams.map((p, index) => ({
    index,
    players: p,
    strength: nodes[p[0]!]!.strength + nodes[p[1]!]!.strength,
  }));
}

/** Nº de confrontos (dentro dos grupos) que repetem adversários já enfrentados. */
export function countRepeatedOpponents(
  groups: number[][],
  teams: TeamInfo[],
  nodes: PlayerNode[],
  opponentHistory: Map<string, number>,
): number {
  let repeated = 0;
  for (const g of groups) {
    for (let x = 0; x < g.length; x++) {
      for (let y = x + 1; y < g.length; y++) {
        const ta = teams[g[x]!]!;
        const tb = teams[g[y]!]!;
        const aIds = [nodes[ta.players[0]]!.id, nodes[ta.players[1]]!.id];
        const bIds = [nodes[tb.players[0]]!.id, nodes[tb.players[1]]!.id];
        let faced = false;
        for (const ai of aIds) {
          for (const bi of bIds) {
            if ((opponentHistory.get(pairKey(ai, bi)) ?? 0) > 0) faced = true;
          }
        }
        if (faced) repeated++;
      }
    }
  }
  return repeated;
}

/**
 * Distribui as duplas em grupos de tamanhos `sizes`, equilibrando a soma de força
 * (greedy pelo grupo mais "leve" com vaga). Quando repetição de adversários é proibida,
 * roda passes de troca entre grupos que reduzem confrontos repetidos sem estourar os tamanhos.
 */
export function groupTeams(
  teams: TeamInfo[],
  nodes: PlayerNode[],
  sizes: number[],
  opponentHistory: Map<string, number>,
  config: DrawConfig,
): number[][] {
  // Ordena por força desc (tie-break estável pelo índice).
  const order = [...teams].sort((a, b) => b.strength - a.strength || a.index - b.index);

  const groups: number[][] = sizes.map(() => []);
  const sums = sizes.map(() => 0);

  for (const t of order) {
    // Grupo com vaga e menor soma atual (tie-break menor índice de grupo).
    let target = -1;
    let best = Infinity;
    for (let g = 0; g < sizes.length; g++) {
      if (groups[g]!.length >= sizes[g]!) continue;
      if (sums[g]! < best) {
        best = sums[g]!;
        target = g;
      }
    }
    groups[target]!.push(t.index);
    sums[target]! += t.strength;
  }

  if (!config.allowRepeatOpponents && sizes.length > 1) {
    optimizeOpponents(groups, teams, nodes, opponentHistory);
  }
  return groups;
}

/** Trocas entre grupos que reduzem confrontos repetidos (mantém tamanhos). */
function optimizeOpponents(
  groups: number[][],
  teams: TeamInfo[],
  nodes: PlayerNode[],
  opponentHistory: Map<string, number>,
  maxPasses = 6,
): void {
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    const base = countRepeatedOpponents(groups, teams, nodes, opponentHistory);
    if (base === 0) return;
    for (let g1 = 0; g1 < groups.length && !improved; g1++) {
      for (let g2 = g1 + 1; g2 < groups.length && !improved; g2++) {
        for (let a = 0; a < groups[g1]!.length && !improved; a++) {
          for (let b = 0; b < groups[g2]!.length && !improved; b++) {
            const ta = groups[g1]![a]!;
            const tb = groups[g2]![b]!;
            groups[g1]![a] = tb;
            groups[g2]![b] = ta;
            const after = countRepeatedOpponents(groups, teams, nodes, opponentHistory);
            if (after < base) {
              improved = true;
            } else {
              // desfaz
              groups[g1]![a] = ta;
              groups[g2]![b] = tb;
            }
          }
        }
      }
    }
    if (!improved) return;
  }
}
