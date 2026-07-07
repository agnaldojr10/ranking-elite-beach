import type { StaffUser } from '@reb/contracts';
import { apiFetch } from './api';

/** Lista a equipe (ADMIN/ORGANIZER) do clube. Vazio se não autorizado. */
export async function listStaff(): Promise<StaffUser[]> {
  const res = await apiFetch<StaffUser[]>('/users');
  return res.ok ? res.data : [];
}
