'use server';

import { revalidatePath } from 'next/cache';
import {
  BulkCreateRegistrationSchema,
  QuickAddPlayerSchema,
  type DrawResult,
  type PlayerType,
  type RoundReport,
} from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type ActionState = { ok?: boolean; error?: string };

/** Marca vários atletas como presentes (inscrição em lote). */
export async function registerPresentAction(
  roundId: string,
  playerIds: string[],
): Promise<ActionState & { added?: number }> {
  const parsed = BulkCreateRegistrationSchema.safeParse({ playerIds, status: 'CONFIRMED' });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Seleção inválida' };
  }
  const res = await apiFetch<{ added: number }>(`/me/rounds/${roundId}/registrations/bulk`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true, added: res.data.added };
}

/** Cadastro rápido: cria o atleta e já o marca presente (CONFIRMADO) na rodada. */
export async function quickAddPlayerAction(
  roundId: string,
  name: string,
  type: PlayerType,
): Promise<ActionState> {
  const parsed = QuickAddPlayerSchema.safeParse({ name, type });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Nome inválido' };
  const res = await apiFetch(`/me/rounds/${roundId}/players`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Sorteia (simulação — não grava). Devolve a prévia para o atleta confirmar. */
export async function simulateDrawAction(
  roundId: string,
): Promise<{ result?: DrawResult; error?: string }> {
  const res = await apiFetch<DrawResult>(`/me/rounds/${roundId}/draw/simulate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) return { error: res.message };
  return { result: res.data };
}

/** Edita o sorteio: força dois jogadores a serem dupla. */
export async function pairDrawAction(
  roundId: string,
  playerAId: string,
  playerBId: string,
): Promise<ActionState> {
  const res = await apiFetch(`/me/rounds/${roundId}/draw/pair`, {
    method: 'PATCH',
    body: JSON.stringify({ playerAId, playerBId }),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Confirma o sorteio visto (grava as duplas/grupos/jogos). */
export async function confirmDrawAction(roundId: string, seed: string): Promise<ActionState> {
  if (!seed) return { error: 'Sorteie as duplas antes de confirmar.' };
  const res = await apiFetch(`/me/rounds/${roundId}/draw/confirm`, {
    method: 'POST',
    body: JSON.stringify({ seed }),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Lança o placar de um jogo (sets) ou W.O. */
export async function saveResultAction(
  matchId: string,
  roundId: string,
  payload: { sets?: { a: number; b: number }[]; walkover?: { winnerTeamId: string; injury: boolean } },
): Promise<ActionState> {
  const res = await apiFetch(`/me/matches/${matchId}/result`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Gera o mata-mata (após a fase de grupos completa). */
export async function generateKnockoutAction(roundId: string): Promise<ActionState> {
  const res = await apiFetch(`/me/rounds/${roundId}/knockout/generate`, { method: 'POST' });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Reverte o mata-mata (apaga chave + colocação; volta a rodada p/ em andamento). */
export async function revertKnockoutAction(roundId: string): Promise<ActionState> {
  const res = await apiFetch(`/me/rounds/${roundId}/knockout`, { method: 'DELETE' });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rodada/${roundId}`);
  return { ok: true };
}

/** Gera o texto do relatório (colocação + ranking) para compartilhar. */
export async function getReportAction(
  roundId: string,
): Promise<{ text?: string; error?: string }> {
  const res = await apiFetch<RoundReport>(`/me/rounds/${roundId}/report`);
  if (!res.ok) return { error: res.message };
  return { text: res.data.text };
}

/** Gera o texto do sorteio (grupos + duplas) para compartilhar. */
export async function getDrawReportAction(
  roundId: string,
): Promise<{ text?: string; error?: string }> {
  const res = await apiFetch<RoundReport>(`/me/rounds/${roundId}/draw-report`);
  if (!res.ok) return { error: res.message };
  return { text: res.data.text };
}
