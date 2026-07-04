import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computeStreaks,
  computeWinRate,
  type DashboardSummary,
  type PlayerStats,
} from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ranking: RankingService,
  ) {}

  async getPlayerStats(clubId: string, playerId: string): Promise<PlayerStats> {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, clubId },
      select: { id: true, name: true },
    });
    if (!player) {
      throw new NotFoundException({
        error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' },
      });
    }

    const scope = { championship: { season: { clubId } } };

    // Colocações e pontos (RoundResult das duplas do jogador).
    const results = await this.prisma.roundResult.findMany({
      where: { team: { players: { some: { playerId } } }, round: scope },
      include: { round: { select: { championshipId: true } } },
    });
    const points = results.reduce((s, r) => s + r.pointsAwarded, 0);
    const roundsPlayed = results.length;
    const championshipsPlayed = new Set(results.map((r) => r.round.championshipId)).size;
    const positions = results.map((r) => r.finalPosition);
    const bestPlacement = positions.length ? Math.min(...positions) : null;
    const worstPlacement = positions.length ? Math.max(...positions) : null;
    const titles = positions.filter((p) => p === 1).length;
    const finals = positions.filter((p) => p <= 2).length;

    // V/D, aproveitamento e sequências (Match do jogador, em ordem cronológica).
    const teams = await this.prisma.team.findMany({
      where: { players: { some: { playerId } }, round: scope },
      select: { id: true },
    });
    const teamIds = new Set(teams.map((t) => t.id));
    const matches = await this.prisma.match.findMany({
      where: {
        status: { not: 'PENDING' },
        OR: [{ teamAId: { in: [...teamIds] } }, { teamBId: { in: [...teamIds] } }],
      },
      orderBy: { createdAt: 'asc' },
      select: { teamAId: true, teamBId: true, winnerTeamId: true, isWalkover: true, walkoverInjury: true },
    });

    const outcomes: ('W' | 'L')[] = [];
    let wins = 0;
    let losses = 0;
    for (const m of matches) {
      if (!m.winnerTeamId) continue;
      const teamId = teamIds.has(m.teamAId) ? m.teamAId : m.teamBId;
      const won = m.winnerTeamId === teamId;
      if (won) {
        wins += 1;
        outcomes.push('W');
      } else {
        if (m.isWalkover && m.walkoverInjury) continue; // BR-32: não penaliza o lesionado
        losses += 1;
        outcomes.push('L');
      }
    }
    const { longestWin, longestLoss } = computeStreaks(outcomes);

    const [favoritePartner, topOpponent] = await Promise.all([
      this.favoritePartner(clubId, playerId),
      this.topOpponent(clubId, playerId),
    ]);

    return {
      playerId: player.id,
      playerName: player.name,
      championshipsPlayed,
      roundsPlayed,
      points,
      avgPoints: roundsPlayed ? Number((points / roundsPlayed).toFixed(1)) : 0,
      wins,
      losses,
      winRate: computeWinRate(wins, losses),
      bestPlacement,
      worstPlacement,
      titles,
      finals,
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      favoritePartner,
      topOpponent,
    };
  }

  async getDashboard(clubId: string): Promise<DashboardSummary> {
    const scope = { championship: { season: { clubId } } };
    const [activePlayers, seasons, championships, rounds, finishedRounds] = await Promise.all([
      this.prisma.player.count({ where: { clubId, status: 'ACTIVE' } }),
      this.prisma.season.count({ where: { clubId } }),
      this.prisma.championship.count({ where: { season: { clubId } } }),
      this.prisma.round.count({ where: scope }),
      this.prisma.round.count({ where: { ...scope, status: 'FINISHED' } }),
    ]);

    const next = await this.prisma.round.findFirst({
      where: { ...scope, status: { in: ['SCHEDULED', 'OPEN'] } },
      orderBy: [{ number: 'asc' }],
      include: { championship: { select: { name: true } } },
    });
    const nextRound = next
      ? {
          id: next.id,
          number: next.number,
          kind: next.kind,
          championshipName: next.championship.name,
          date: next.date ? next.date.toISOString().slice(0, 10) : null,
          status: next.status,
        }
      : null;

    const finished = await this.prisma.round.findMany({
      where: { ...scope, status: 'FINISHED' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: {
        championship: { select: { name: true } },
        results: {
          where: { finalPosition: 1 },
          include: { team: { include: { players: { include: { player: { select: { name: true } } } } } } },
        },
      },
    });
    const recentResults = finished.map((r) => ({
      roundId: r.id,
      roundNumber: r.number,
      kind: r.kind,
      championshipName: r.championship.name,
      championNames: r.results[0]?.team.players.map((p) => p.player.name) ?? [],
    }));

    const latestChamp = await this.prisma.championship.findFirst({
      where: { season: { clubId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const topRanking = latestChamp
      ? (await this.ranking.getRanking(clubId, latestChamp.id, 'GLOBAL')).entries.slice(0, 5)
      : [];

    return {
      kpis: { activePlayers, seasons, championships, rounds, finishedRounds },
      nextRound,
      recentResults,
      topRanking,
    };
  }

  // ---- helpers -----------------------------------------------------------

  private async favoritePartner(clubId: string, playerId: string) {
    const row = await this.prisma.partnerHistory.findFirst({
      where: { clubId, OR: [{ playerAId: playerId }, { playerBId: playerId }] },
      orderBy: { timesTogether: 'desc' },
    });
    if (!row) return null;
    const otherId = row.playerAId === playerId ? row.playerBId : row.playerAId;
    const other = await this.prisma.player.findUnique({ where: { id: otherId }, select: { name: true } });
    return { playerId: otherId, playerName: other?.name ?? '?', timesTogether: row.timesTogether };
  }

  private async topOpponent(clubId: string, playerId: string) {
    const row = await this.prisma.opponentHistory.findFirst({
      where: { clubId, OR: [{ playerAId: playerId }, { playerBId: playerId }] },
      orderBy: { timesFaced: 'desc' },
    });
    if (!row) return null;
    const otherId = row.playerAId === playerId ? row.playerBId : row.playerAId;
    const other = await this.prisma.player.findUnique({ where: { id: otherId }, select: { name: true } });
    return { playerId: otherId, playerName: other?.name ?? '?', timesFaced: row.timesFaced };
  }
}
