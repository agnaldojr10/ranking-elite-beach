'use server';

import { revalidatePath } from 'next/cache';
import { CreateSeasonSchema, type SeasonStatus } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { error?: string; ok?: boolean };

export async function createSeasonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CreateSeasonSchema.safeParse({
    year: formData.get('year'),
    name: formData.get('name'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const res = await apiFetch('/seasons', { method: 'POST', body: JSON.stringify(parsed.data) });
  if (!res.ok) return { error: res.message };

  revalidatePath('/seasons');
  return { ok: true };
}

export async function setSeasonStatusAction(id: string, status: SeasonStatus): Promise<void> {
  await apiFetch(`/seasons/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  revalidatePath('/seasons');
}
