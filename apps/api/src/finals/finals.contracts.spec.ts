import { describe, expect, it } from 'vitest';
import { FinalStateSchema } from '@reb/contracts';

describe('FinalStateSchema (Fase 10)', () => {
  it('aceita final em andamento sem campeão', () => {
    const parsed = FinalStateSchema.safeParse({
      roundId: 'r1',
      number: 11,
      status: 'OPEN',
      champion: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita final encerrada com campeão', () => {
    const parsed = FinalStateSchema.safeParse({
      roundId: 'r1',
      number: 11,
      status: 'FINISHED',
      champion: { teamId: 't1', playerNames: ['Ana', 'Bia'] },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita status inválido', () => {
    const parsed = FinalStateSchema.safeParse({
      roundId: 'r1',
      number: 11,
      status: 'X',
      champion: null,
    });
    expect(parsed.success).toBe(false);
  });
});
