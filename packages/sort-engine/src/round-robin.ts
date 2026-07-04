import type { DrawMatch } from '@reb/contracts';

/** Nome do grupo por índice: 0→A, 1→B, ... */
export function groupName(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Round-robin dentro de cada grupo: todos contra todos (BR-22).
 * `groups` traz IDs de dupla; retorna os confrontos por grupo.
 */
export function buildRoundRobin(groups: string[][]): DrawMatch[] {
  const matches: DrawMatch[] = [];
  groups.forEach((teamIds, g) => {
    const name = groupName(g);
    for (let a = 0; a < teamIds.length; a++) {
      for (let b = a + 1; b < teamIds.length; b++) {
        matches.push({ groupName: name, teamAId: teamIds[a]!, teamBId: teamIds[b]! });
      }
    }
  });
  return matches;
}
