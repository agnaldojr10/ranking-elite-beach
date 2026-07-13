'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreatePlayerSchema, UpdatePlayerSchema, type PlayerStatus } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { error?: string };

function readForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    photoUrl: String(formData.get('photoUrl') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    skillLevel: String(formData.get('skillLevel') ?? 'INTERMEDIATE'),
    status: String(formData.get('status') ?? 'ACTIVE'),
    type: String(formData.get('type') ?? 'REGULAR'),
  };
}

export async function createPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CreatePlayerSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const res = await apiFetch('/players', { method: 'POST', body: JSON.stringify(parsed.data) });
  if (!res.ok) return { error: res.message };

  revalidatePath('/players');
  redirect('/players');
}

export async function updatePlayerAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = UpdatePlayerSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const res = await apiFetch(`/players/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath('/players');
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}`);
}

export async function setPlayerStatusAction(id: string, status: PlayerStatus): Promise<void> {
  await apiFetch(`/players/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  revalidatePath('/players');
  revalidatePath(`/players/${id}`);
}

/** Gera um convite de acesso ao portal para o atleta (código em claro, uso único). */
export async function generatePlayerInviteAction(
  playerId: string,
): Promise<{ code?: string; expiresAt?: string; error?: string }> {
  const res = await apiFetch<{ code: string; expiresAt: string }>(
    `/players/${playerId}/invite`,
    { method: 'POST' },
  );
  if (!res.ok) return { error: res.message };
  return { code: res.data.code, expiresAt: res.data.expiresAt };
}
