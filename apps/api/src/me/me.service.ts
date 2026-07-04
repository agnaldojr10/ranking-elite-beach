import { Injectable } from '@nestjs/common';
import {
  roundLabel,
  type MatchTeamRef,
  type MeRanking,
  type Player as PlayerDto,
  type PlayerMatch,
  type PlayerStats,
  type SetScore,
} from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';
import { RankingService } from '../ranking/ranking.service';
import { StatsService } from '../stats/stats.service';

/** Dados escopados ao próprio atleta autenticado (Portal do Jogador). */
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly players: PlayersService,
    private readonly stats: StatsService,
    private readonly ranking: RankingService,
  ) {}

  getProfile(clubId: string, playerId: string): Promise<PlayerDto> {
    return this.players.get(clubId, playerId);
  }

  getStats(clubId: string, playerId: string): Promise<PlayerStats> {
    return this.stats.getPlayerStats(clubId, playerId);
  }

  /** Todos os jogos do atleta (grupos + mata-mata), do ponto de vista dele. */
  async getMatches(clubId: string, playerId: string): Promise<PlayerMatch[]> {
    const scope = { championship: { season: { clubId } } };
    const teams = await this.prisma.team.findMany({
      where: { players: { some: { playerId } }, round: scope },
      select: { id: true },
    });
    const teamIds = teams.map((t) => t.id);
    if (teamIds.length === 0) return [];

    const matches = await this.prisma.match.findMany({
      where: { OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }] },
      include: {
        venue: { select: { name: true } },
        teamA: { include: { players: { include: { player: { select: { name: true } } } } } },
        teamB: { include: { players: { include: { player: { select: { name: true } } } } } },
        group: { select: { name: true } },
        round: { select: { number: true, kind: true, championship: { select: { name: true } } } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });

    const mineIds = new Set(teamIds);
    return matches.map((m) => {
      const aIsMine = mineIds.has(m.teamAId);
      const mine = aIsMine ? m.teamA : m.teamB;
      const opp = aIsMine ? m.teamB : m.teamA;
      const myTeamId = aIsMine ? m.teamAId : m.teamBId;
      const didIWin = m.winnerTeamId ? m.winnerTeamId === myTeamId : null;
      const champName = m.round?.championship.name ?? null;
      return {
        id: m.id,
        championshipName: champName ?? '',
        roundLabel: m.round
          ? roundLabel({ kind: m.round.kind, number: m.round.number, championshipName: champName })
          : m.stage ?? 'Mata-mata',
        groupName: m.group?.name ?? m.stage ?? 'Mata-mata',
        mine: this.teamRef(myTeamId, mine),
        opponent: this.teamRef(aIsMine ? m.teamBId : m.teamAId, opp),
        sets: (m.sets as SetScore[] | null) ?? null,
        status: m.status,
        didIWin,
        venueName: m.venue?.name ?? null,
        scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
      };
    });
  }

  /** Próximo jogo do atleta: o pendente mais próximo (agendado no futuro ou o 1º pendente). */
  async getNextMatch(clubId: string, playerId: string): Promise<PlayerMatch | null> {
    const matches = await this.getMatches(clubId, playerId);
    const pending = matches.filter((m) => m.status === 'PENDING');
    if (pending.length === 0) return null;
    const now = Date.now();
    const future = pending
      .filter((m) => m.scheduledAt && new Date(m.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    if (future.length > 0) return future[0]!;
    // Sem horário futuro: primeiro pendente com horário; senão o primeiro pendente.
    const scheduled = pending.filter((m) => m.scheduledAt);
    return (scheduled[0] ?? pending[0])!;
  }

  /** Posição do atleta no ranking do campeonato mais recente + variação (▲▼). */
  async getRanking(clubId: string, playerId: string): Promise<MeRanking> {
    const champ = await this.prisma.championship.findFirst({
      where: { season: { clubId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    });
    if (!champ) {
      return {
        championshipId: null,
        championshipName: null,
        position: null,
        total: 0,
        points: 0,
        wins: 0,
        losses: 0,
        delta: null,
      };
    }

    const ranking = await this.ranking.getRanking(clubId, champ.id, 'CHAMPIONSHIP');
    const idx = ranking.entries.findIndex((e) => e.playerId === playerId);
    const row = idx >= 0 ? ranking.entries[idx] : null;

    return {
      championshipId: champ.id,
      championshipName: champ.name,
      position: idx >= 0 ? idx + 1 : null,
      total: ranking.entries.length,
      points: row?.points ?? 0,
      wins: row?.wins ?? 0,
      losses: row?.losses ?? 0,
      delta: await this.rankingDelta(clubId, champ.id, playerId, idx >= 0 ? idx + 1 : null),
    };
  }

  /** Variação de posição vs. a rodada anterior (por pontos acumulados na evolução). */
  private async rankingDelta(
    clubId: string,
    championshipId: string,
    playerId: string,
    currentPosition: number | null,
  ): Promise<number | null> {
    if (currentPosition === null) return null;
    const evolution = await this.ranking.getEvolution(clubId, championshipId);
    if (evolution.rounds.length < 2) return null;
    const prevIdx = evolution.rounds.length - 2; // penúltima rodada
    const standingsPrev = evolution.players
      .map((p) => ({ playerId: p.playerId, points: p.cumulative[prevIdx] ?? 0 }))
      .sort((a, b) => b.points - a.points);
    const prevPos = standingsPrev.findIndex((p) => p.playerId === playerId) + 1;
    if (prevPos === 0) return null;
    return prevPos - currentPosition; // >0 subiu, <0 caiu
  }

  private teamRef(
    id: string,
    team: { label: string; players: { player: { name: string } }[] },
  ): MatchTeamRef {
    const names = team.players.map((p) => p.player.name);
    return { id, label: team.label, playerNames: [names[0] ?? '?', names[1] ?? '?'] };
  }
}
