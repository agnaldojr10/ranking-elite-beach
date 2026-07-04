import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DEFAULT_MATCH_FORMAT,
  FinalConfigSchema,
  type FinalState,
} from '@reb/contracts';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class FinalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ranking: RankingService,
  ) {}

  async generate(clubId: string, championshipId: string): Promise<{ roundId: string }> {
    const champ = await this.prisma.championship.findFirst({
      where: { id: championshipId, season: { clubId } },
      include: { config: true },
    });
    if (!champ) {
      throw new NotFoundException({
        error: { code: 'CHAMPIONSHIP_NOT_FOUND', message: 'Campeonato não encontrado' },
      });
    }
    if (champ.status !== 'ACTIVE') {
      throw new ConflictException({
        error: {
          code: 'CHAMPIONSHIP_NOT_ACTIVE',
          message: 'A fase final só pode ser gerada com o campeonato ativo',
        },
      });
    }

    const existing = await this.prisma.round.findFirst({
      where: { championshipId, kind: 'FINAL_PHASE' },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        error: { code: 'FINAL_EXISTS', message: 'A fase final deste campeonato já foi gerada' },
      });
    }

    // Classifica os melhores jogadores por pontuação acumulada (rodadas regulares).
    const ranking = await this.ranking.getRanking(clubId, championshipId, 'CHAMPIONSHIP');
    const qualifiers = ranking.entries.slice(0, champ.qualifiersCount).map((e) => e.playerId);
    if (qualifiers.length === 0) {
      throw new UnprocessableEntityException({
        error: {
          code: 'NO_RANKING',
          message: 'Não há ranking suficiente para classificar (encerre rodadas com pontos antes).',
        },
      });
    }

    const groupSizePref = champ.config
      ? FinalConfigSchema.parse(champ.config.finalConfig).groupSizePreference
      : 3;

    const last = await this.prisma.round.findFirst({
      where: { championshipId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const number = (last?.number ?? 0) + 1;

    const round = await this.prisma.$transaction(async (tx) => {
      const r = await tx.round.create({
        data: {
          championshipId,
          number,
          kind: 'FINAL_PHASE',
          status: 'OPEN',
          groupSizePref,
          matchFormat: DEFAULT_MATCH_FORMAT as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.registration.createMany({
        data: qualifiers.map((playerId) => ({ roundId: r.id, playerId, status: 'CONFIRMED' as const })),
      });
      return r;
    });

    return { roundId: round.id };
  }

  async getFinal(clubId: string, championshipId: string): Promise<FinalState> {
    const champ = await this.prisma.championship.findFirst({
      where: { id: championshipId, season: { clubId } },
      select: { id: true },
    });
    if (!champ) {
      throw new NotFoundException({
        error: { code: 'CHAMPIONSHIP_NOT_FOUND', message: 'Campeonato não encontrado' },
      });
    }

    const round = await this.prisma.round.findFirst({
      where: { championshipId, kind: 'FINAL_PHASE' },
      select: { id: true, number: true, status: true },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'FINAL_NOT_FOUND', message: 'Fase final ainda não gerada' },
      });
    }

    let champion: FinalState['champion'] = null;
    if (round.status === 'FINISHED') {
      const winner = await this.prisma.roundResult.findFirst({
        where: { roundId: round.id, finalPosition: 1 },
        include: { team: { include: { players: { include: { player: { select: { name: true } } } } } } },
      });
      if (winner) {
        champion = {
          teamId: winner.teamId,
          playerNames: winner.team.players.map((p) => p.player.name),
        };
      }
    }

    return { roundId: round.id, number: round.number, status: round.status, champion };
  }
}
