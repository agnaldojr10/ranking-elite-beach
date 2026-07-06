'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CreateRegistrationSchema,
  CreateRoundSchema,
  RecordClassificationSchema,
  type DrawResult,
  type RegistrationStatus,
  type RoundStatus,
} from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { ok?: boolean; error?: string };

/** Lança a rodada só por classificação (participantes + duplas do pódio). */
export async function saveClassificationAction(
  roundId: string,
  payload: unknown,
): Promise<FormState> {
  const parsed = RecordClassificationSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const res = await apiFetch(`/rounds/${roundId}/classification`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };
  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export type DrawState = { result?: DrawResult; error?: string };

export async function simulateDrawAction(
  roundId: string,
  _prev: DrawState,
  formData: FormData,
): Promise<DrawState> {
  const rawRandomness = String(formData.get('randomness') ?? '').trim();
  const body: Record<string, unknown> = {};
  if (rawRandomness) body.randomness = Number(rawRandomness);
  // Sem seed → a API gera uma nova a cada clique (regenerar).

  const res = await apiFetch<DrawResult>(`/rounds/${roundId}/draw/simulate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { error: res.message };
  return { result: res.data };
}

export async function confirmDrawAction(
  roundId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const seed = String(formData.get('seed') ?? '').trim();
  const rawRandomness = String(formData.get('randomness') ?? '').trim();
  if (!seed) return { error: 'Simule um sorteio antes de confirmar.' };

  const body: Record<string, unknown> = { seed };
  if (rawRandomness) body.randomness = Number(rawRandomness);

  const res = await apiFetch(`/rounds/${roundId}/draw/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/draw`);
  redirect(`/rounds/${roundId}`);
}

export async function discardDrawAction(roundId: string): Promise<void> {
  await apiFetch(`/rounds/${roundId}/draw`, { method: 'DELETE' });
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/draw`);
  redirect(`/rounds/${roundId}`);
}

export async function generateKnockoutAction(roundId: string): Promise<void> {
  await apiFetch(`/rounds/${roundId}/knockout/generate`, { method: 'POST' });
  revalidatePath(`/rounds/${roundId}/knockout`);
  revalidatePath(`/rounds/${roundId}`);
}

export async function scheduleMatchAction(
  matchId: string,
  roundId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const venueRaw = String(formData.get('venueId') ?? '');
  const timeRaw = String(formData.get('scheduledAt') ?? '').trim();
  const body: Record<string, unknown> = { venueId: venueRaw || null };
  body.scheduledAt = timeRaw ? new Date(timeRaw).toISOString() : null;

  const res = await apiFetch(`/matches/${matchId}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/rounds/${roundId}/results`);
  revalidatePath(`/rounds/${roundId}/knockout`);
  return { ok: true };
}

export async function registerMatchResultAction(
  matchId: string,
  roundId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const mode = String(formData.get('mode') ?? 'sets');

  let body: Record<string, unknown>;
  if (mode === 'walkover') {
    const winnerTeamId = String(formData.get('winnerTeamId') ?? '');
    if (!winnerTeamId) return { error: 'Selecione o vencedor do W.O.' };
    body = { walkover: { winnerTeamId, injury: formData.get('injury') === 'on' } };
  } else {
    const sets: { a: number; b: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const a = String(formData.get(`set${i}_a`) ?? '').trim();
      const b = String(formData.get(`set${i}_b`) ?? '').trim();
      if (a === '' && b === '') continue;
      sets.push({ a: Number(a), b: Number(b) });
    }
    if (sets.length === 0) return { error: 'Informe o placar.' };
    body = { sets };
  }

  const res = await apiFetch(`/matches/${matchId}/result`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/rounds/${roundId}/results`);
  return { ok: true };
}

export async function createRoundAction(
  championshipId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawNumber = String(formData.get('number') ?? '').trim();
  const parsed = CreateRoundSchema.safeParse({
    ...(rawNumber ? { number: rawNumber } : {}),
    date: formData.get('date') ?? '',
    kind: formData.get('kind') ?? 'REGULAR',
    groupSizePref: formData.get('groupSizePref') ?? 3,
    matchFormat: {
      sets: Number(formData.get('sets') ?? 1),
      gamesPerSet: Number(formData.get('gamesPerSet') ?? 6),
      matchTieBreak: formData.get('matchTieBreak') === 'on',
    },
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch<{ id: string }>(`/championships/${championshipId}/rounds`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/championships/${championshipId}`);
  redirect(`/rounds/${res.data.id}`);
}

export async function setRoundStatusAction(
  roundId: string,
  championshipId: string,
  status: RoundStatus,
): Promise<void> {
  await apiFetch(`/rounds/${roundId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/championships/${championshipId}`);
}

export async function createRegistrationAction(
  roundId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = CreateRegistrationSchema.safeParse({
    playerId: formData.get('playerId'),
    status: formData.get('status') ?? 'CONFIRMED',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Selecione um jogador' };

  const res = await apiFetch(`/rounds/${roundId}/registrations`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function setRegistrationStatusAction(
  registrationId: string,
  roundId: string,
  status: RegistrationStatus,
): Promise<void> {
  await apiFetch(`/registrations/${registrationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  revalidatePath(`/rounds/${roundId}`);
}

export async function substituteRegistrationAction(
  registrationId: string,
  roundId: string,
  formData: FormData,
): Promise<void> {
  const substitutedById = String(formData.get('substitutedById') ?? '');
  if (!substitutedById) return;

  await apiFetch(`/registrations/${registrationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ substitutedById, status: 'ABSENT' }),
  });
  revalidatePath(`/rounds/${roundId}`);
}

export async function removeRegistrationAction(
  registrationId: string,
  roundId: string,
): Promise<void> {
  await apiFetch(`/registrations/${registrationId}`, { method: 'DELETE' });
  revalidatePath(`/rounds/${roundId}`);
}
