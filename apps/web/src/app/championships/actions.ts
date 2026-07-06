'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CreateChampionshipSchema,
  TiebreakerSchema,
  UpdateChampionshipConfigSchema,
  UpdateChampionshipSchema,
  type ChampionshipStatus,
  type Tiebreaker,
} from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { error?: string };

export async function createChampionshipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = CreateChampionshipSchema.safeParse({
    seasonId: formData.get('seasonId'),
    name: formData.get('name'),
    roundsCount: formData.get('roundsCount'),
    qualifiersCount: formData.get('qualifiersCount'),
    startDate: formData.get('startDate') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch<{ id: string }>('/championships', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath('/championships');
  redirect(`/championships/${res.data.id}`);
}

export async function updateBasicsAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = UpdateChampionshipSchema.safeParse({
    name: formData.get('name'),
    roundsCount: formData.get('roundsCount'),
    qualifiersCount: formData.get('qualifiersCount'),
    startDate: formData.get('startDate') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch(`/championships/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/championships/${id}`);
  redirect(`/championships/${id}`);
}

export async function updateConfigAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locked = formData.get('locked') === '1';

  const config: Record<string, unknown> = {
    drawWeights: {
      ranking: Number(formData.get('w_ranking') ?? 0),
      skill: Number(formData.get('w_skill') ?? 0),
      partner: Number(formData.get('w_partner') ?? 0),
      opponent: Number(formData.get('w_opponent') ?? 0),
    },
    randomness: Number(formData.get('randomness') ?? 50),
    participationPoints: Number(formData.get('participationPoints') ?? 0),
    allowRepeatPartners: formData.get('allowRepeatPartners') === 'on',
    allowRepeatOpponents: formData.get('allowRepeatOpponents') === 'on',
  };

  // Campos estruturais só são enviados quando o campeonato está em DRAFT (BR-05).
  if (!locked) {
    const scoringTable: Record<string, number> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('score_')) {
        const placement = key.slice('score_'.length);
        const n = Number(value);
        if (Number.isFinite(n)) scoringTable[placement] = n;
      }
    }
    const tiebreakers: Tiebreaker[] = [];
    for (const slot of ['tb_0', 'tb_1', 'tb_2', 'tb_3', 'tb_4']) {
      const raw = String(formData.get(slot) ?? '');
      const parsed = TiebreakerSchema.safeParse(raw);
      if (parsed.success && !tiebreakers.includes(parsed.data)) tiebreakers.push(parsed.data);
    }
    config.scoringTable = scoringTable;
    config.tiebreakers = tiebreakers;
    config.finalConfig = {
      groupSizePreference: Number(formData.get('groupSizePreference') ?? 3),
      format: 'GROUPS_KNOCKOUT',
    };
  }

  const parsed = UpdateChampionshipConfigSchema.safeParse(config);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Config inválida' };

  const res = await apiFetch(`/championships/${id}/config`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath(`/championships/${id}`);
  redirect(`/championships/${id}`);
}

export async function setChampionshipStatusAction(
  id: string,
  status: ChampionshipStatus,
): Promise<void> {
  await apiFetch(`/championships/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  revalidatePath(`/championships/${id}`);
  revalidatePath('/championships');
}

export async function generateFinalAction(championshipId: string): Promise<void> {
  const res = await apiFetch<{ roundId: string }>(
    `/championships/${championshipId}/finals/generate`,
    { method: 'POST' },
  );
  revalidatePath(`/championships/${championshipId}`);
  if (res.ok) redirect(`/rounds/${res.data.roundId}`);
}
