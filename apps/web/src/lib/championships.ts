import type { Championship, Season } from '@reb/contracts';
import { apiFetch } from './api';

export async function listSeasons(): Promise<Season[]> {
  const res = await apiFetch<Season[]>('/seasons');
  return res.ok ? res.data : [];
}

export async function listChampionships(seasonId?: string): Promise<Championship[]> {
  const qs = seasonId ? `?seasonId=${seasonId}` : '';
  const res = await apiFetch<Championship[]>(`/championships${qs}`);
  return res.ok ? res.data : [];
}

export async function getChampionship(id: string): Promise<Championship | null> {
  const res = await apiFetch<Championship>(`/championships/${id}`);
  return res.ok ? res.data : null;
}
