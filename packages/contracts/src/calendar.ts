import { z } from 'zod';

export const CalendarEventTypeSchema = z.enum(['ROUND', 'FINAL', 'EVENT', 'TRAINING']);
export type CalendarEventType = z.infer<typeof CalendarEventTypeSchema>;

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  ROUND: 'Rodada',
  FINAL: 'Final',
  EVENT: 'Evento',
  TRAINING: 'Treino',
};

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

/** Só eventos manuais podem ser criados; rodadas/finais são derivadas das rodadas. */
export const CreateCalendarEventSchema = z.object({
  type: z.enum(['EVENT', 'TRAINING']),
  title: z.string().trim().min(1, 'Título obrigatório').max(160),
  date: dateOnly,
});
export type CreateCalendarEvent = z.infer<typeof CreateCalendarEventSchema>;

/** Item unificado da agenda (derivado + manual). */
export const CalendarItemSchema = z.object({
  id: z.string(),
  type: CalendarEventTypeSchema,
  title: z.string(),
  date: z.string(), // YYYY-MM-DD
  refId: z.string().nullable(), // rodada, quando aplicável
  manual: z.boolean(), // true = CalendarEvent (removível)
});
export type CalendarItem = z.infer<typeof CalendarItemSchema>;

export const CalendarQuerySchema = z
  .object({
    from: dateOnly,
    to: dateOnly,
  })
  .refine((q) => q.from <= q.to, { message: 'O início deve ser anterior ou igual ao fim' });
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;
