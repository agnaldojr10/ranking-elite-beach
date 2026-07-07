'use server';

import { revalidatePath } from 'next/cache';
import { CreateStaffUserSchema, type StaffRole } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export type FormState = { ok?: boolean; error?: string };

/** Cria um novo membro da equipe (ADMIN/ORGANIZER). */
export async function createStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CreateStaffUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') ?? 'ADMIN',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  const res = await apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.message };

  revalidatePath('/admins');
  return { ok: true };
}

/** Ativa/desativa um membro (desativar corta o acesso na hora). */
export async function setStaffActiveAction(userId: string, isActive: boolean): Promise<void> {
  await apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  revalidatePath('/admins');
}

/** Muda o papel de um membro (promover a ADMIN ou rebaixar a ORGANIZER). */
export async function setStaffRoleAction(userId: string, role: StaffRole): Promise<void> {
  await apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  revalidatePath('/admins');
}
