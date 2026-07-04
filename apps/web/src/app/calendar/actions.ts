'use server';

import { revalidatePath } from 'next/cache';
import { CreateCalendarEventSchema } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { ok?: boolean; error?: string };

export async function createCalendarEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = CreateCalendarEventSchema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    date: formData.get('date'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch('/calendar', { method: 'POST', body: JSON.stringify(parsed.data) });
  if (!res.ok) return { error: res.message };

  revalidatePath('/calendar');
  return { ok: true };
}

export async function deleteCalendarEventAction(id: string): Promise<void> {
  await apiFetch(`/calendar/${id}`, { method: 'DELETE' });
  revalidatePath('/calendar');
}
