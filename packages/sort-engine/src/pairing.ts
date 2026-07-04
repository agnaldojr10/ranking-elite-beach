import { pairKey, type DrawConfig, type DrawPlayerInput } from '@reb/contracts';
import { SKILL_STRENGTH } from '@reb/contracts';
import { randInt, type Rng } from './prng';

/** Custo aplicado a um par de parceiros já vistos quando repetição é proibida (BR-18). */
export const PROHIBITIVE = 1000;

export type PlayerNode = {
  index: number;
  id: string;
  name: string;
  strength: number; // 0..100 (proxy de ranking)
  skill: number; // 0..100 (nível técnico)
};

export type CostTerms = {
  total: number;
  partnerPenalty: number;
  complementarity: number;
  skillComplement: number;
  timesTogether: number;
};

export function toNodes(players: DrawPlayerInput[]): PlayerNode[] {
  return players.map((p, index) => ({
    index,
    id: p.id,
    name: p.name,
    strength: p.strength,
    skill: SKILL_STRENGTH[p.skillLevel],
  }));
}

/**
 * Custo de parear i e j (menor = melhor). Recompensa complementaridade (forte+fraco —
 * BR-15) e nível complementar (BR-16); penaliza parceiros repetidos (BR-13/18).
 */
export function buildCostFn(
  nodes: PlayerNode[],
  partnerHistory: Map<string, number>,
  config: DrawConfig,
) {
  const w = config.weights;
  return function cost(i: number, j: number): CostTerms {
    const a = nodes[i]!;
    const b = nodes[j]!;
    const timesTogether = partnerHistory.get(pairKey(a.id, b.id)) ?? 0;

    let partnerPenalty: number;
    if (config.allowRepeatPartners) {
      partnerPenalty = timesTogether;
    } else {
      partnerPenalty = timesTogether > 0 ? PROHIBITIVE + timesTogether : 0;
    }

    const complementarity = Math.abs(a.strength - b.strength) / 100; // 0..1
    const skillComplement = Math.abs(a.skill - b.skill) / 100; // 0..1

    const total =
      w.partner * partnerPenalty - w.ranking * complementarity - w.skill * skillComplement;

    return { total, partnerPenalty, complementarity, skillComplement, timesTogether };
  };
}

export type Pair = [number, number];

/** Custo total de um conjunto de duplas. */
export function totalCost(teams: Pair[], cost: (i: number, j: number) => CostTerms): number {
  let sum = 0;
  for (const [i, j] of teams) sum += cost(i, j).total;
  return sum;
}

/**
 * Emparelhamento greedy: percorre os índices numa ordem (possivelmente perturbada pelo rng)
 * e, para cada jogador livre, escolhe o parceiro livre de menor custo.
 */
export function greedyPairing(
  nodes: PlayerNode[],
  cost: (i: number, j: number) => CostTerms,
  rng: Rng,
  jitter = 0,
): Pair[] {
  const n = nodes.length;
  const used = new Array<boolean>(n).fill(false);
  const order = [...Array(n).keys()];
  // Perturba a ordem de escolha conforme o jitter (exploração).
  if (jitter > 0) {
    for (let k = order.length - 1; k > 0; k--) {
      if (rng() < jitter) {
        const s = randInt(rng, k + 1);
        [order[k], order[s]] = [order[s]!, order[k]!];
      }
    }
  }

  const teams: Pair[] = [];
  for (const i of order) {
    if (used[i]) continue;
    used[i] = true;
    let best = -1;
    let bestCost = Infinity;
    for (let j = 0; j < n; j++) {
      if (used[j] || j === i) continue;
      const c = cost(i, j).total;
      if (c < bestCost) {
        bestCost = c;
        best = j;
      }
    }
    if (best >= 0) {
      used[best] = true;
      teams.push([i, best]);
    }
  }
  return teams;
}

/**
 * Busca local 2-opt: troca jogadores entre duas duplas quando reduz o custo global.
 * Repete até estabilizar (ou atingir maxPasses).
 */
export function twoOpt(
  teams: Pair[],
  cost: (i: number, j: number) => CostTerms,
  maxPasses = 8,
): Pair[] {
  const t = teams.map((p) => [...p] as Pair);
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    for (let x = 0; x < t.length; x++) {
      for (let y = x + 1; y < t.length; y++) {
        const [a, b] = t[x]!;
        const [c, d] = t[y]!;
        const current = cost(a, b).total + cost(c, d).total;
        // Opção 1: trocar b <-> c  → (a,c) e (b,d)
        const opt1 = cost(a, c).total + cost(b, d).total;
        // Opção 2: trocar b <-> d  → (a,d) e (b,c)
        const opt2 = cost(a, d).total + cost(b, c).total;
        if (opt1 < current - 1e-9 && opt1 <= opt2) {
          t[x] = [a, c];
          t[y] = [b, d];
          improved = true;
        } else if (opt2 < current - 1e-9) {
          t[x] = [a, d];
          t[y] = [b, c];
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return t;
}
