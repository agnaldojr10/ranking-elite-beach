import { describe, expect, it } from 'vitest';
import {
  AvailabilitySlotSchema,
  CalendarQuerySchema,
  CreateCalendarEventSchema,
  CreateVenueSchema,
  ScheduleMatchSchema,
} from '@reb/contracts';

describe('CreateVenueSchema (RF-29)', () => {
  it('aceita quadra com nome', () => {
    expect(CreateVenueSchema.safeParse({ name: 'Quadra 1', number: 1 }).success).toBe(true);
  });
  it('rejeita sem nome', () => {
    expect(CreateVenueSchema.safeParse({ number: 1 }).success).toBe(false);
  });
});

describe('AvailabilitySlotSchema', () => {
  it('aceita janela válida', () => {
    expect(AvailabilitySlotSchema.safeParse({ weekday: 3, start: '18:00', end: '22:00' }).success).toBe(true);
  });
  it('rejeita horário inválido', () => {
    expect(AvailabilitySlotSchema.safeParse({ weekday: 3, start: '25:00', end: '22:00' }).success).toBe(false);
  });
  it('rejeita início após fim', () => {
    expect(AvailabilitySlotSchema.safeParse({ weekday: 3, start: '22:00', end: '18:00' }).success).toBe(false);
  });
  it('rejeita weekday fora de 0..6', () => {
    expect(AvailabilitySlotSchema.safeParse({ weekday: 7, start: '18:00', end: '22:00' }).success).toBe(false);
  });
});

describe('ScheduleMatchSchema', () => {
  it('aceita null para desvincular', () => {
    expect(ScheduleMatchSchema.safeParse({ venueId: null, scheduledAt: null }).success).toBe(true);
  });
  it('aceita datetime com offset', () => {
    expect(ScheduleMatchSchema.safeParse({ scheduledAt: '2026-07-10T19:00:00-03:00' }).success).toBe(true);
  });
});

describe('CreateCalendarEventSchema (RF-30)', () => {
  it('aceita treino', () => {
    expect(CreateCalendarEventSchema.safeParse({ type: 'TRAINING', title: 'Treino', date: '2026-07-10' }).success).toBe(true);
  });
  it('rejeita type ROUND (derivado, não manual)', () => {
    expect(CreateCalendarEventSchema.safeParse({ type: 'ROUND', title: 'x', date: '2026-07-10' }).success).toBe(false);
  });
  it('rejeita data inválida', () => {
    expect(CreateCalendarEventSchema.safeParse({ type: 'EVENT', title: 'x', date: '10/07' }).success).toBe(false);
  });
});

describe('CalendarQuerySchema', () => {
  it('aceita from<=to', () => {
    expect(CalendarQuerySchema.safeParse({ from: '2026-07-01', to: '2026-07-31' }).success).toBe(true);
  });
  it('rejeita from>to', () => {
    expect(CalendarQuerySchema.safeParse({ from: '2026-07-31', to: '2026-07-01' }).success).toBe(false);
  });
});
