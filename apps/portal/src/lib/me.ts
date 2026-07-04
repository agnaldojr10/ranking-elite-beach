import type { MeRanking, Player, PlayerMatch, PlayerStats } from '@reb/contracts';
import { apiFetch } from './api';

export async function getMyProfile(): Promise<Player | null> {
  const res = await apiFetch<Player>('/me/profile');
  return res.ok ? res.data : null;
}

export async function getMyStats(): Promise<PlayerStats | null> {
  const res = await apiFetch<PlayerStats>('/me/stats');
  return res.ok ? res.data : null;
}

export async function getMyRanking(): Promise<MeRanking | null> {
  const res = await apiFetch<MeRanking>('/me/ranking');
  return res.ok ? res.data : null;
}

export async function getMyNextMatch(): Promise<PlayerMatch | null> {
  const res = await apiFetch<PlayerMatch | null>('/me/next-match');
  return res.ok ? res.data : null;
}

export async function getMyMatches(): Promise<PlayerMatch[]> {
  const res = await apiFetch<PlayerMatch[]>('/me/matches');
  return res.ok ? res.data : [];
}
