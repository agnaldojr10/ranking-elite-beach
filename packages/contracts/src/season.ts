import { z } from 'zod';

export const SeasonStatusSchema = z.enum(['OPEN', 'CLOSED']);
export type SeasonStatus = z.infer<typeof SeasonStatusSchema>;

export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Encerrada',
};

export const CreateSeasonSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  name: z.string().trim().min(2).max(80),
});
export type CreateSeason = z.infer<typeof CreateSeasonSchema>;

export const UpdateSeasonStatusSchema = z.object({ status: SeasonStatusSchema });
export type UpdateSeasonStatus = z.infer<typeof UpdateSeasonStatusSchema>;

export const SeasonSchema = z.object({
  id: z.string().uuid(),
  clubId: z.string().uuid(),
  year: z.number().int(),
  name: z.string(),
  status: SeasonStatusSchema,
  championshipsCount: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
});
export type Season = z.infer<typeof SeasonSchema>;
