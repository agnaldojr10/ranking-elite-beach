import { z } from 'zod';

const timeHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:MM');

/** Janela de disponibilidade da quadra por dia da semana (0=Dom … 6=Sáb). */
export const AvailabilitySlotSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start: timeHHMM,
    end: timeHHMM,
  })
  .refine((s) => s.start < s.end, { message: 'O início deve ser antes do fim' });
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

export const CreateVenueSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  number: z.coerce.number().int().min(0).max(999).optional(),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  availability: z.array(AvailabilitySlotSchema).max(50).optional(),
});
export type CreateVenue = z.infer<typeof CreateVenueSchema>;

export const UpdateVenueSchema = CreateVenueSchema.partial();
export type UpdateVenue = z.infer<typeof UpdateVenueSchema>;

export const VenueSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  number: z.number().int().nullable(),
  location: z.string().nullable(),
  availability: z.array(AvailabilitySlotSchema),
  createdAt: z.string(),
});
export type Venue = z.infer<typeof VenueSchema>;

/** Vincular quadra e/ou horário a um jogo (RF-29). null desvincula. */
export const ScheduleMatchSchema = z.object({
  venueId: z.string().uuid().nullable().optional(),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal('')),
});
export type ScheduleMatch = z.infer<typeof ScheduleMatchSchema>;
