'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateVenueSchema, UpdateVenueSchema } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { error?: string };

function parseForm(formData: FormData) {
  return {
    name: formData.get('name'),
    number: String(formData.get('number') ?? '').trim() || undefined,
    location: formData.get('location') ?? '',
  };
}

export async function createVenueAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CreateVenueSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch('/venues', { method: 'POST', body: JSON.stringify(parsed.data) });
  if (!res.ok) return { error: res.message };

  revalidatePath('/venues');
  redirect('/venues');
}

export async function updateVenueAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = UpdateVenueSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch(`/venues/${id}`, { method: 'PATCH', body: JSON.stringify(parsed.data) });
  if (!res.ok) return { error: res.message };

  revalidatePath('/venues');
  redirect('/venues');
}

export async function deleteVenueAction(id: string): Promise<void> {
  await apiFetch(`/venues/${id}`, { method: 'DELETE' });
  revalidatePath('/venues');
}
