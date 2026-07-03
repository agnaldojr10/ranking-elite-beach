import { describe, expect, it } from 'vitest';
import { CreatePlayerSchema, PlayerQuerySchema, computeAge } from '@reb/contracts';

describe('computeAge', () => {
  it('calcula idade antes do aniversário no ano', () => {
    const now = new Date('2026-07-03');
    expect(computeAge('2000-12-25', now)).toBe(25);
  });

  it('calcula idade depois do aniversário no ano', () => {
    const now = new Date('2026-07-03');
    expect(computeAge('2000-01-10', now)).toBe(26);
  });

  it('idade no dia do aniversário', () => {
    const now = new Date('2026-07-03');
    expect(computeAge('2010-07-03', now)).toBe(16);
  });
});

describe('CreatePlayerSchema', () => {
  it('aceita jogador válido e aplica defaults', () => {
    const parsed = CreatePlayerSchema.parse({ name: 'João Silva', birthDate: '1990-05-20' });
    expect(parsed.skillLevel).toBe('INTERMEDIATE');
    expect(parsed.status).toBe('ACTIVE');
  });

  it('rejeita nome curto', () => {
    expect(CreatePlayerSchema.safeParse({ name: 'J', birthDate: '1990-05-20' }).success).toBe(false);
  });

  it('rejeita data em formato inválido', () => {
    expect(CreatePlayerSchema.safeParse({ name: 'João', birthDate: '20/05/1990' }).success).toBe(
      false,
    );
  });
});

describe('PlayerQuerySchema', () => {
  it('aplica paginação padrão', () => {
    const q = PlayerQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(20);
  });
});
