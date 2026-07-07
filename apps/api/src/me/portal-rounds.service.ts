import { Injectable } from '@nestjs/common';
import {
  buildRoundReport,
  roundLabel,
  type Round,
  type RoundReport,
  type SkillLevel,
} from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../ranking/ranking.service';
import { KnockoutService } from '../rounds/knockout.service';
import { RoundsService } from '../rounds/rounds.service';

/**
 * Suporte ao Portal do Jogador para OPERAR a rodada (qualquer atleta do clube):
 * lista as rodadas do campeonato ativo e monta o relatório de texto (WhatsApp).
 * O sorteio/placar/mata-mata em si reusam os serviços do backoffice.
 */
@Injectable()
export class PortalRoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rounds: RoundsService,
    private readonly knockout: KnockoutService,
    private readonly ranking: RankingService,
  ) {}

  /** Rodadas do campeonato ATIVO do clube (o "dia" que o atleta vai operar). */
  async listRounds(clubId: string): Promise<Round[]> {
    const champ = await this.activeChampionship(clubId);
    if (!champ) return [];
    return this.rounds.list(clubId, champ.id);
  }

  /** Atletas ATIVOS do clube ainda não inscritos na rodada (p/ marcar presentes). */
  async eligiblePlayers(
    clubId: string,
    roundId: string,
  ): Promise<{ id: string; name: string; skillLevel: SkillLevel }[]> {
    const round = await this.rounds.get(clubId, roundId); // valida escopo do clube
    const registered = new Set((round.registrations ?? []).map((r) => r.player.id));
    const players = await this.prisma.player.findMany({
      where: { clubId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, skillLevel: true },
    });
    return players
      .filter((p) => !registered.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, skillLevel: p.skillLevel as SkillLevel }));
  }

  /** Relatório de texto da rodada: colocação + ranking atualizado do campeonato. */
  async report(clubId: string, roundId: string): Promise<RoundReport> {
    const round = await this.rounds.get(clubId, roundId);
    const championshipId = round.championshipId;

    const [results, ranking] = await Promise.all([
      this.knockout.getResult(clubId, roundId),
      this.ranking.getRanking(clubId, championshipId, 'CHAMPIONSHIP'),
    ]);

    const text = buildRoundReport({
      championshipName: round.championshipName,
      roundLabel: roundLabel(round),
      date: round.date,
      results: results.map((r) => ({
        playerNames: r.playerNames,
        finalPosition: r.finalPosition,
        pointsAwarded: r.pointsAwarded,
      })),
      ranking: ranking.entries.map((e) => ({ playerName: e.playerName, points: e.points })),
      // Relatório do WhatsApp lista o ranking COMPLETO do campeonato.
      rankingLimit: ranking.entries.length,
    });

    return { text };
  }

  private async activeChampionship(clubId: string): Promise<{ id: string } | null> {
    const active = await this.prisma.championship.findFirst({
      where: { season: { clubId }, status: 'ACTIVE' },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    if (active) return active;
    // Sem campeonato ativo: cai para o mais recente do clube (evita tela vazia).
    return this.prisma.championship.findFirst({
      where: { season: { clubId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }
}
