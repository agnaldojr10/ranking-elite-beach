import type { CalendarItem } from '@reb/contracts';
import { apiFetch } from './api';

export async function getCalendar(from: string, to: string): Promise<CalendarItem[]> {
  const res = await apiFetch<CalendarItem[]>(`/calendar?from=${from}&to=${to}`);
  return res.ok ? res.data : [];
}
