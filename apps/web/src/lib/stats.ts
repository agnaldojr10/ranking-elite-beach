import type { DashboardSummary, PlayerStats } from '@reb/contracts';
import { apiFetch } from './api';

export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const res = await apiFetch<PlayerStats>(`/players/${playerId}/stats`);
  return res.ok ? res.data : null;
}

export async function getDashboard(): Promise<DashboardSummary | null> {
  const res = await apiFetch<DashboardSummary>('/dashboard');
  return res.ok ? res.data : null;
}
