import { describe, expect, it } from 'vitest';
import {
  aggregatePairs,
  applyCounterDeltas,
  opponentPairsFromMatches,
  partnerPairsFromTeams,
  type HistoryCounterDelegate,
} from './history.service';

type Row = {
  id: string;
  clubId: string;
  playerAId: string;
  playerBId: string;
  count: number;
  lastRoundId: string;
};

function makeFakeStore() {
  const rows = new Map<string, Row>();
  let seq = 0;
  const k = (c: string, a: string, b: string) => `${c}|${a}|${b}`;
  const delegate: HistoryCounterDelegate = {
    findFirst: async ({ where }) => {
      const r = rows.get(k(where.clubId, where.playerAId, where.playerBId));
      return r ? { id: r.id, count: r.count } : null;
    },
    create: async ({ clubId, playerAId, playerBId, count, lastRoundId }) => {
      const id = `r${++seq}`;
      rows.set(k(clubId, playerAId, playerBId), { id, clubId, playerAId, playerBId, count, lastRoundId });
    },
    update: async ({ id, count, lastRoundId }) => {
      for (const r of rows.values()) if (r.id === id) { r.count = count; r.lastRoundId = lastRoundId; }
    },
    delete: async ({ id }) => {
      for (const [key, r] of rows) if (r.id === id) rows.delete(key);
    },
  };
  return { rows, delegate };
}

describe('helpers de pares', () => {
  it('partnerPairsFromTeams: um par por dupla', () => {
    const pairs = partnerPairsFromTeams([
      { players: ['a', 'b'] },
      { players: ['c', 'd'] },
    ]);
    expect(pairs).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('opponentPairsFromMatches: produto cruzado (4 por confronto)', () => {
    const teamPlayers = new Map<string, [string, string]>([
      ['t1', ['a', 'b']],
      ['t2', ['c', 'd']],
    ]);
    const pairs = opponentPairsFromMatches([{ teamAId: 't1', teamBId: 't2' }], teamPlayers);
    expect(pairs).toHaveLength(4);
    expect(pairs).toEqual([['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd']]);
  });

  it('aggregatePairs conta duplicatas normalizando a ordem', () => {
    const agg = aggregatePairs([['b', 'a'], ['a', 'b'], ['c', 'd']]);
    expect(agg.get('a|b')).toBe(2);
    expect(agg.get('c|d')).toBe(1);
  });
});

describe('applyCounterDeltas', () => {
  const CLUB = 'club1';
  const ROUND = 'round1';
  const pairs: [string, string][] = [['a', 'b'], ['c', 'd']];

  it('incrementa criando linhas (count=1)', async () => {
    const { rows, delegate } = makeFakeStore();
    await applyCounterDeltas(delegate, CLUB, ROUND, pairs, 1);
    expect(rows.size).toBe(2);
    expect([...rows.values()].every((r) => r.count === 1)).toBe(true);
  });

  it('confirmar duas vezes acumula (count=2)', async () => {
    const { rows, delegate } = makeFakeStore();
    await applyCounterDeltas(delegate, CLUB, ROUND, pairs, 1);
    await applyCounterDeltas(delegate, CLUB, ROUND, pairs, 1);
    expect([...rows.values()].every((r) => r.count === 2)).toBe(true);
  });

  it('reversão é simétrica: +1 seguido de -1 zera o histórico', async () => {
    const { rows, delegate } = makeFakeStore();
    await applyCounterDeltas(delegate, CLUB, ROUND, pairs, 1);
    await applyCounterDeltas(delegate, CLUB, ROUND, pairs, -1);
    expect(rows.size).toBe(0);
  });

  it('descartar não deixa contagem negativa (apaga em zero)', async () => {
    const { rows, delegate } = makeFakeStore();
    await applyCounterDeltas(delegate, CLUB, ROUND, [['a', 'b']], 1);
    await applyCounterDeltas(delegate, CLUB, ROUND, [['a', 'b']], -1);
    await applyCounterDeltas(delegate, CLUB, ROUND, [['a', 'b']], -1); // reversão extra é inócua
    expect(rows.size).toBe(0);
  });
});