import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MatchFormatSchema,
  computeGroupStandings,
  computeMatchWinner,
  type GroupStandings,
  type MatchView,
  type RegisterMatchResult,
  type SetScore,
  type StandingMatch,
  type StandingTeam,
} from '@reb/contracts';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';
import { PushService, type PushPayload } from '../push/push.service';
import { KnockoutService } from './knockout.service';

type GroupWithData = Prisma.GroupGetPayload<{
  include: {
    teams: {
      include: {
        team: { include: { players: { include: { player: { select: { name: true } } } } } };
      };
    };
    matches: { include: { venue: { select: { name: true } } } };
  };
}>;

type TeamRef = { id: string; label: string; playerNames: [string, string]; seed: number };

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knockout: KnockoutService,
    private readonly push: PushService,
  ) {}

  /** Notifica (best-effort) os jogadores das duas duplas de um jogo. */
  private async notifyMatchPlayers(
    teamAId: string,
    teamBId: string,
    payload: PushPayload,
  ): Promise<void> {
    try {
      const players = await this.prisma.teamPlayer.findMany({
        where: { teamId: { in: [teamAId, teamBId] } },
        select: { playerId: true },
      });
      await this.push.notifyPlayers(
        players.map((p) => p.playerId),
        payload,
      );
    } catch {
      /* notificação é best-effort; não interrompe o fluxo */
    }
  }

  async getMatches(clubId: string, roundId: string): Promise<MatchView[]> {
    const groups = await this.loadGroups(clubId, roundId);
    const views: MatchView[] = [];
    for (const g of groups) {
      const refs = this.teamRefs(g);
      for (const m of g.matches) {
        views.push(this.toView(g.name, m, refs));
      }
    }
    return views;
  }

  async getStandings(clubId: string, roundId: string): Promise<GroupStandings[]> {
    const groups = await this.loadGroups(clubId, roundId);
    return groups.map((g) => {
      const refs = this.teamRefs(g);
      const teams: StandingTeam[] = [...refs.values()].map((r) => ({
        teamId: r.id,
        label: r.label,
        playerNames: r.playerNames,
        seed: r.seed,
      }));
      const matches: StandingMatch[] = g.matches.map((m) => ({
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        sets: (m.sets as SetScore[] | null) ?? null,
        winnerTeamId: m.winnerTeamId,
        status: m.status,
      }));
      return { groupName: g.name, standings: computeGroupStandings(matches, teams) };
    });
  }

  async registerResult(
    clubId: string,
    matchId: string,
    userId: string,
    dto: RegisterMatchResult,
  ): Promise<MatchView> {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { group: { round: { championship: { season: { clubId } } } } },
          { round: { championship: { season: { clubId } } } },
        ],
      },
      include: {
        group: { include: { round: { select: { id: true, status: true, matchFormat: true } } } },
        round: { select: { id: true, status: true, matchFormat: true } },
        teamA: { include: { players: { include: { player: { select: { name: true } } } } } },
        teamB: { include: { players: { include: { player: { select: { name: true } } } } } },
        venue: { select: { name: true } },
      },
    });
    if (!match) {
      throw new NotFoundException({
        error: { code: 'MATCH_NOT_FOUND', message: 'Jogo não encontrado' },
      });
    }

    const round = match.round ?? match.group?.round;
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    if (round.status !== 'DRAWN' && round.status !== 'IN_PROGRESS') {
      throw new ConflictException({
        error: {
          code: 'ROUND_NOT_DRAWN',
          message: 'Só é possível lançar resultados de uma rodada sorteada',
        },
      });
    }

    const format = MatchFormatSchema.parse(round.matchFormat);

    let data: {
      sets: SetScore[];
      winnerTeamId: string;
      status: 'PLAYED' | 'WALKOVER';
      isWalkover: boolean;
      walkoverInjury: boolean;
    };

    if (dto.walkover) {
      const { winnerTeamId, injury } = dto.walkover;
      if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
        throw new ConflictException({
          error: { code: 'INVALID_WALKOVER', message: 'Vencedor do W.O. inválido para este jogo' },
        });
      }
      const winA = winnerTeamId === match.teamAId;
      data = {
        sets: [{ a: winA ? format.walkoverGames : 0, b: winA ? 0 : format.walkoverGames }],
        winnerTeamId,
        status: 'WALKOVER',
        isWalkover: true,
        walkoverInjury: injury,
      };
    } else {
      const result = computeMatchWinner(dto.sets!, format, match.teamAId, match.teamBId);
      if (!result.valid) {
        throw new UnprocessableEntityException({
          error: { code: 'INVALID_SCORE', message: result.reason },
        });
      }
      data = {
        sets: dto.sets!,
        winnerTeamId: result.winnerTeamId,
        status: 'PLAYED',
        isWalkover: false,
        walkoverInjury: false,
      };
    }

    const before = {
      sets: match.sets,
      winnerTeamId: match.winnerTeamId,
      status: match.status,
      isWalkover: match.isWalkover,
      walkoverInjury: match.walkoverInjury,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          sets: data.sets as unknown as Prisma.InputJsonValue,
          winnerTeamId: data.winnerTeamId,
          status: data.status,
          isWalkover: data.isWalkover,
          walkoverInjury: data.walkoverInjury,
          updatedById: userId,
        },
      });
      await tx.matchResultLog.create({
        data: {
          matchId,
          changedById: userId,
          before: before as unknown as Prisma.InputJsonValue,
          after: data as unknown as Prisma.InputJsonValue,
        },
      });
      if (round.status === 'DRAWN') {
        await tx.round.update({ where: { id: round.id }, data: { status: 'IN_PROGRESS' } });
      }
    });

    const score = data.sets.map((s) => `${s.a}-${s.b}`).join(' ');
    await this.notifyMatchPlayers(match.teamAId, match.teamBId, {
      title: 'Resultado lançado',
      body: `Seu jogo foi registrado: ${score}.`,
      url: '/jogos',
    });

    // Jogo de mata-mata: avança a chave (próxima fase / 3º lugar / finalização).
    if (match.phase === 'KNOCKOUT') {
      await this.knockout.progress(clubId, round.id);
      return {
        id: matchId,
        groupName: match.stage ?? 'Mata-mata',
        teamA: this.refFromTeam(match.teamAId, match.teamA),
        teamB: this.refFromTeam(match.teamBId, match.teamB),
        sets: data.sets,
        winnerTeamId: data.winnerTeamId,
        status: data.status,
        isWalkover: data.isWalkover,
        walkoverInjury: data.walkoverInjury,
        venueId: match.venueId,
        venueName: match.venue?.name ?? null,
        scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      };
    }

    const groups = await this.loadGroups(clubId, round.id);
    const g = groups.find((x) => x.id === match.groupId)!;
    const updated = g.matches.find((m) => m.id === matchId)!;
    return this.toView(g.name, updated, this.teamRefs(g));
  }

  private refFromTeam(
    id: string,
    team: { label: string; players: { player: { name: string } }[] },
  ): MatchView['teamA'] {
    const names = team.players.map((p) => p.player.name);
    return { id, label: team.label, playerNames: [names[0] ?? '?', names[1] ?? '?'] };
  }

  // ---- helpers -----------------------------------------------------------

  private async loadGroups(clubId: string, roundId: string): Promise<GroupWithData[]> {
    const round = await this.prisma.round.findFirst({
      where: { id: roundId, championship: { season: { clubId } } },
      select: { id: true },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    return this.prisma.group.findMany({
      where: { roundId },
      orderBy: { name: 'asc' },
      include: {
        teams: {
          orderBy: { seed: 'asc' },
          include: {
            team: { include: { players: { include: { player: { select: { name: true } } } } } },
          },
        },
        matches: { include: { venue: { select: { name: true } } } },
      },
    });
  }

  private teamRefs(g: GroupWithData): Map<string, TeamRef> {
    const map = new Map<string, TeamRef>();
    for (const gt of g.teams) {
      const names = gt.team.players.map((p) => p.player.name);
      map.set(gt.team.id, {
        id: gt.team.id,
        label: gt.team.label,
        playerNames: [names[0] ?? '?', names[1] ?? '?'],
        seed: gt.seed,
      });
    }
    return map;
  }

  private toView(
    groupName: string,
    m: GroupWithData['matches'][number],
    refs: Map<string, TeamRef>,
  ): MatchView {
    const ref = (id: string) => {
      const r = refs.get(id);
      return { id, label: r?.label ?? '?', playerNames: r?.playerNames ?? (['?', '?'] as [string, string]) };
    };
    return {
      id: m.id,
      groupName,
      teamA: ref(m.teamAId),
      teamB: ref(m.teamBId),
      sets: (m.sets as SetScore[] | null) ?? null,
      winnerTeamId: m.winnerTeamId,
      status: m.status,
      isWalkover: m.isWalkover,
      walkoverInjury: m.walkoverInjury,
      venueId: m.venueId,
      venueName: m.venue?.name ?? null,
      scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
    };
  }

  async scheduleMatch(
    clubId: string,
    matchId: string,
    dto: { venueId?: string | null; scheduledAt?: string | null },
  ): Promise<MatchView> {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { group: { round: { championship: { season: { clubId } } } } },
          { round: { championship: { season: { clubId } } } },
        ],
      },
      select: { id: true, teamAId: true, teamBId: true },
    });
    if (!match) {
      throw new NotFoundException({
        error: { code: 'MATCH_NOT_FOUND', message: 'Jogo não encontrado' },
      });
    }

    if (dto.venueId) {
      const venue = await this.prisma.venue.findFirst({
        where: { id: dto.venueId, clubId },
        select: { id: true },
      });
      if (!venue) {
        throw new ConflictException({
          error: { code: 'VENUE_INVALID', message: 'Quadra inválida para este clube' },
        });
      }
    }

    const data: Prisma.MatchUpdateInput = {};
    if (dto.venueId !== undefined) {
      data.venue = dto.venueId ? { connect: { id: dto.venueId } } : { disconnect: true };
    }
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    await this.prisma.match.update({ where: { id: matchId }, data });

    if (dto.scheduledAt !== undefined || dto.venueId !== undefined) {
      await this.notifyMatchPlayers(match.teamAId, match.teamBId, {
        title: 'Jogo reagendado',
        body: 'O horário ou a quadra do seu jogo foi atualizado. Confira.',
        url: '/jogos',
      });
    }

    return this.fetchMatchView(matchId);
  }

  private async fetchMatchView(matchId: string): Promise<MatchView> {
    const m = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        group: { select: { name: true } },
        teamA: { include: { players: { include: { player: { select: { name: true } } } } } },
        teamB: { include: { players: { include: { player: { select: { name: true } } } } } },
        venue: { select: { name: true } },
      },
    });
    return {
      id: m.id,
      groupName: m.group?.name ?? m.stage ?? 'Mata-mata',
      teamA: this.refFromTeam(m.teamAId, m.teamA),
      teamB: this.refFromTeam(m.teamBId, m.teamB),
      sets: (m.sets as SetScore[] | null) ?? null,
      winnerTeamId: m.winnerTeamId,
      status: m.status,
      isWalkover: m.isWalkover,
      walkoverInjury: m.walkoverInjury,
      venueId: m.venueId,
      venueName: m.venue?.name ?? null,
      scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
    };
  }
}
