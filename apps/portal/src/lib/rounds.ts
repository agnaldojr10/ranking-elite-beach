import type {
  ConfirmedDraw,
  GroupStandings,
  KnockoutView,
  MatchView,
  Round,
  RoundReport,
  RoundResultView,
} from '@reb/contracts';
import { apiFetch } from './api';

export type EligiblePlayer = { id: string; name: string; skillLevel: string };

/** Rodadas do campeonato ativo do clube (o "dia" a operar). */
export async function getOperableRounds(): Promise<Round[]> {
  const res = await apiFetch<Round[]>('/me/rounds');
  return res.ok ? res.data : [];
}

export async function getOperableRound(id: string): Promise<Round | null> {
  const res = await apiFetch<Round>(`/me/rounds/${id}`);
  return res.ok ? res.data : null;
}

export async function getEligiblePlayers(id: string): Promise<EligiblePlayer[]> {
  const res = await apiFetch<EligiblePlayer[]>(`/me/rounds/${id}/eligible-players`);
  return res.ok ? res.data : [];
}

export async function getRoundDraw(id: string): Promise<ConfirmedDraw | null> {
  const res = await apiFetch<ConfirmedDraw>(`/me/rounds/${id}/draw`);
  return res.ok ? res.data : null;
}

export async function getRoundMatches(id: string): Promise<MatchView[]> {
  const res = await apiFetch<MatchView[]>(`/me/rounds/${id}/matches`);
  return res.ok ? res.data : [];
}

export async function getRoundStandings(id: string): Promise<GroupStandings[]> {
  const res = await apiFetch<GroupStandings[]>(`/me/rounds/${id}/standings`);
  return res.ok ? res.data : [];
}

export async function getRoundKnockout(id: string): Promise<KnockoutView | null> {
  const res = await apiFetch<KnockoutView>(`/me/rounds/${id}/knockout`);
  return res.ok ? res.data : null;
}

export async function getRoundResult(id: string): Promise<RoundResultView[]> {
  const res = await apiFetch<RoundResultView[]>(`/me/rounds/${id}/result`);
  return res.ok ? res.data : [];
}

export async function getRoundReport(id: string): Promise<string | null> {
  const res = await apiFetch<RoundReport>(`/me/rounds/${id}/report`);
  return res.ok ? res.data.text : null;
}
