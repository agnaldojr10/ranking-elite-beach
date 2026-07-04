import type { FinalState } from '@reb/contracts';
import { apiFetch } from './api';

export async function getFinalState(championshipId: string): Promise<FinalState | null> {
  const res = await apiFetch<FinalState>(`/championships/${championshipId}/finals`);
  return res.ok ? res.data : null;
}
