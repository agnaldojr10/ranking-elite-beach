import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

/** Dispara o lembrete "seu jogo vai começar" para jogos próximos (uma vez cada). */
@Injectable()
export class PushScheduler {
  private readonly logger = new Logger('PushScheduler');

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async remindUpcoming(): Promise<void> {
    if (!this.push.enabled) return;

    const leadMin = this.config.getOrThrow<number>('PUSH_START_LEAD_MIN');
    const now = new Date();
    const until = new Date(now.getTime() + leadMin * 60 * 1000);

    const matches = await this.prisma.match.findMany({
      where: {
        status: 'PENDING',
        startNotifiedAt: null,
        scheduledAt: { gte: now, lte: until },
      },
      include: {
        venue: { select: { name: true } },
        teamA: { include: { players: { select: { playerId: true } } } },
        teamB: { include: { players: { select: { playerId: true } } } },
      },
    });
    if (matches.length === 0) return;

    for (const m of matches) {
      const playerIds = [...m.teamA.players, ...m.teamB.players].map((p) => p.playerId);
      const time = m.scheduledAt
        ? m.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '';
      const where = m.venue?.name ? ` em ${m.venue.name}` : '';
      await this.push.notifyPlayers(playerIds, {
        title: 'Seu jogo vai começar',
        body: `Prepare-se: seu jogo é às ${time}${where}.`,
        url: '/jogos',
      });
      await this.prisma.match.update({ where: { id: m.id }, data: { startNotifiedAt: new Date() } });
    }
    this.logger.log(`Lembretes de início enviados: ${matches.length}`);
  }
}
