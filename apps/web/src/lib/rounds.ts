import type {
  ConfirmedDraw,
  GroupStandings,
  KnockoutView,
  MatchView,
  Round,
  RoundResultView,
} from '@reb/contracts';
import { apiFetch } from './api';

export async function listRounds(championshipId: string): Promise<Round[]> {
  const res = await apiFetch<Round[]>(`/championships/${championshipId}/rounds`);
  return res.ok ? res.data : [];
}

export async function getRound(id: string): Promise<Round | null> {
  const res = await apiFetch<Round>(`/rounds/${id}`);
  return res.ok ? res.data : null;
}

export async function getConfirmedDraw(roundId: string): Promise<ConfirmedDraw | null> {
  const res = await apiFetch<ConfirmedDraw>(`/rounds/${roundId}/draw`);
  return res.ok ? res.data : null;
}

export async function getRoundMatches(roundId: string): Promise<MatchView[]> {
  const res = await apiFetch<MatchView[]>(`/rounds/${roundId}/matches`);
  return res.ok ? res.data : [];
}

export async function getRoundStandings(roundId: string): Promise<GroupStandings[]> {
  const res = await apiFetch<GroupStandings[]>(`/rounds/${roundId}/standings`);
  return res.ok ? res.data : [];
}

export async function getKnockout(roundId: string): Promise<KnockoutView | null> {
  const res = await apiFetch<KnockoutView>(`/rounds/${roundId}/knockout`);
  return res.ok ? res.data : null;
}

export async function getRoundResult(roundId: string): Promise<RoundResultView[]> {
  const res = await apiFetch<RoundResultView[]>(`/rounds/${roundId}/result`);
  return res.ok ? res.data : [];
}
