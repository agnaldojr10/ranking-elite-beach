import type { Venue } from '@reb/contracts';
import { apiFetch } from './api';

export async function listVenues(): Promise<Venue[]> {
  const res = await apiFetch<Venue[]>('/venues');
  return res.ok ? res.data : [];
}

export async function getVenue(id: string): Promise<Venue | null> {
  const res = await apiFetch<Venue>(`/venues/${id}`);
  return res.ok ? res.data : null;
}
