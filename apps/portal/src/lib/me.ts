import type {
  MeAchievement,
  MeH2H,
  MeOpponentSummary,
  MeRanking,
  MeTournamentDetail,
  MeTournamentSummary,
  Player,
  PlayerMatch,
  PlayerStats,
} from '@reb/contracts';
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

export async function getMyTournaments(): Promise<MeTournamentSummary[]> {
  const res = await apiFetch<MeTournamentSummary[]>('/me/tournaments');
  return res.ok ? res.data : [];
}

export async function getMyTournament(id: string): Promise<MeTournamentDetail | null> {
  const res = await apiFetch<MeTournamentDetail>(`/me/tournaments/${id}`);
  return res.ok ? res.data : null;
}

export async function getMyOpponents(): Promise<MeOpponentSummary[]> {
  const res = await apiFetch<MeOpponentSummary[]>('/me/opponents');
  return res.ok ? res.data : [];
}

export async function getMyH2H(opponentId: string): Promise<MeH2H | null> {
  const res = await apiFetch<MeH2H>(`/me/h2h/${opponentId}`);
  return res.ok ? res.data : null;
}

export async function getMyAchievements(): Promise<MeAchievement[]> {
  const res = await apiFetch<MeAchievement[]>('/me/achievements');
  return res.ok ? res.data : [];
}
