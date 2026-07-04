import { Injectable } from '@nestjs/common';
import { pairKey } from '@reb/contracts';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

/** Par normalizado (a < b) para as chaves de histórico. */
export function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Agrega uma lista de pares em contagens por chave normalizada. */
export function aggregatePairs(pairs: [string, string][]): Map<string, number> {
  const m = new Map<string, number>();
  for (const [a, b] of pairs) {
    const key = pairKey(a, b);
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

/** Pares de parceiros a partir das duplas. */
export function partnerPairsFromTeams(teams: { players: [string, string] }[]): [string, string][] {
  return teams.map((t) => [t.players[0], t.players[1]] as [string, string]);
}

/** Pares de adversários (produto cruzado) a partir dos confrontos. */
export function opponentPairsFromMatches(
  matches: { teamAId: string; teamBId: string }[],
  teamPlayers: Map<string, [string, string]>,
): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of matches) {
    const a = teamPlayers.get(m.teamAId);
    const b = teamPlayers.get(m.teamBId);
    if (!a || !b) continue;
    for (const pa of a) for (const pb of b) pairs.push([pa, pb]);
  }
  return pairs;
}

/**
 * Delegate mínimo de um contador de histórico (partner/opponent). Permite testar
 * a lógica de incremento/decremento com um duble em memória, sem banco real.
 */
export type HistoryCounterDelegate = {
  findFirst(args: {
    where: { clubId: string; playerAId: string; playerBId: string };
  }): Promise<{ id: string; count: number } | null>;
  create(args: {
    clubId: string;
    playerAId: string;
    playerBId: string;
    count: number;
    lastRoundId: string;
  }): Promise<void>;
  update(args: { id: string; count: number; lastRoundId: string }): Promise<void>;
  delete(args: { id: string }): Promise<void>;
};

/**
 * Aplica os deltas (sign = +1 ao confirmar, -1 ao descartar) a um contador de histórico.
 * Cria/incrementa, decrementa e apaga a linha quando chega a zero. Idempotente por par.
 */
export async function applyCounterDeltas(
  delegate: HistoryCounterDelegate,
  clubId: string,
  roundId: string,
  pairs: [string, string][],
  sign: 1 | -1,
): Promise<void> {
  const aggregated = aggregatePairs(pairs);
  for (const [key, count] of aggregated) {
    const [playerAId, playerBId] = key.split('|') as [string, string];
    const delta = sign * count;
    const existing = await delegate.findFirst({ where: { clubId, playerAId, playerBId } });

    if (!existing) {
      if (delta > 0) {
        await delegate.create({ clubId, playerAId, playerBId, count: delta, lastRoundId: roundId });
      }
      continue;
    }

    const next = existing.count + delta;
    if (next <= 0) {
      await delegate.delete({ id: existing.id });
    } else {
      await delegate.update({ id: existing.id, count: next, lastRoundId: roundId });
    }
  }
}

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Carrega os históricos do clube como mapas pairKey→contagem (usado pelo motor). */
  async loadHistory(
    clubId: string,
  ): Promise<{ partner: Map<string, number>; opponent: Map<string, number> }> {
    const [partners, opponents] = await Promise.all([
      this.prisma.partnerHistory.findMany({ where: { clubId } }),
      this.prisma.opponentHistory.findMany({ where: { clubId } }),
    ]);
    const partner = new Map<string, number>();
    for (const p of partners) partner.set(pairKey(p.playerAId, p.playerBId), p.timesTogether);
    const opponent = new Map<string, number>();
    for (const o of opponents) opponent.set(pairKey(o.playerAId, o.playerBId), o.timesFaced);
    return { partner, opponent };
  }

  /** Aplica (ou reverte) os deltas de um sorteio dentro de uma transação. */
  async applyDrawDeltas(
    tx: Prisma.TransactionClient,
    clubId: string,
    roundId: string,
    partnerPairs: [string, string][],
    opponentPairs: [string, string][],
    sign: 1 | -1,
  ): Promise<void> {
    await applyCounterDeltas(this.partnerDelegate(tx), clubId, roundId, partnerPairs, sign);
    await applyCounterDeltas(this.opponentDelegate(tx), clubId, roundId, opponentPairs, sign);
  }

  private partnerDelegate(tx: Prisma.TransactionClient): HistoryCounterDelegate {
    return {
      findFirst: async ({ where }) => {
        const row = await tx.partnerHistory.findFirst({ where });
        return row ? { id: row.id, count: row.timesTogether } : null;
      },
      create: async ({ clubId, playerAId, playerBId, count, lastRoundId }) => {
        await tx.partnerHistory.create({
          data: { clubId, playerAId, playerBId, timesTogether: count, lastRoundId },
        });
      },
      update: async ({ id, count, lastRoundId }) => {
        await tx.partnerHistory.update({ where: { id }, data: { timesTogether: count, lastRoundId } });
      },
      delete: async ({ id }) => {
        await tx.partnerHistory.delete({ where: { id } });
      },
    };
  }

  private opponentDelegate(tx: Prisma.TransactionClient): HistoryCounterDelegate {
    return {
      findFirst: async ({ where }) => {
        const row = await tx.opponentHistory.findFirst({ where });
        return row ? { id: row.id, count: row.timesFaced } : null;
      },
      create: async ({ clubId, playerAId, playerBId, count, lastRoundId }) => {
        await tx.opponentHistory.create({
          data: { clubId, playerAId, playerBId, timesFaced: count, lastRoundId },
        });
      },
      update: async ({ id, count, lastRoundId }) => {
        await tx.opponentHistory.update({ where: { id }, data: { timesFaced: count, lastRoundId } });
      },
      delete: async ({ id }) => {
        await tx.opponentHistory.delete({ where: { id } });
      },
    };
  }
}