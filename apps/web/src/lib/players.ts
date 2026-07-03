import type { PaginatedPlayers, Player } from '@reb/contracts';
import { apiFetch } from './api';

export type PlayerListParams = {
  q?: string;
  status?: string;
  level?: string;
  page?: string;
};

export async function listPlayers(params: PlayerListParams): Promise<PaginatedPlayers> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
  if (params.level) qs.set('level', params.level);
  if (params.page) qs.set('page', params.page);

  const res = await apiFetch<PaginatedPlayers>(`/players?${qs.toString()}`);
  if (!res.ok) {
    return { data: [], page: 1, pageSize: 20, total: 0 };
  }
  return res.data;
}

export async function getPlayer(id: string): Promise<Player | null> {
  const res = await apiFetch<Player>(`/players/${id}`);
  return res.ok ? res.data : null;
}
