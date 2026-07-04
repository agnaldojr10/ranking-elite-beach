import type { Ranking, RankingEvolution, RankingScope } from '@reb/contracts';
import { apiFetch } from './api';

export async function getRanking(
  championshipId: string,
  scope: RankingScope,
): Promise<Ranking | null> {
  const res = await apiFetch<Ranking>(`/championships/${championshipId}/ranking?scope=${scope}`);
  return res.ok ? res.data : null;
}

export async function getRankingEvolution(
  championshipId: string,
): Promise<RankingEvolution | null> {
  const res = await apiFetch<RankingEvolution>(`/championships/${championshipId}/ranking/evolution`);
  return res.ok ? res.data : null;
}
