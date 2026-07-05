import { Injectable, NotFoundException } from '@nestjs/common';
import {
  roundLabel,
  type GroupStandings,
  type KnockoutMatchView,
  type MatchTeamRef,
  type MeAchievement,
  type MeH2H,
  type MeOpponentSummary,
  type MeRanking,
  type MeTournamentDetail,
  type MeTournamentRound,
  type MeTournamentSummary,
  type Player as PlayerDto,
  type PlayerMatch,
  type PlayerStats,
  type SetScore,
} from '@reb/contracts';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';
import { RankingService } from '../ranking/ranking.service';
import { KnockoutService } from '../rounds/knockout.service';
import { MatchesService } from '../rounds/matches.service';
import { StatsService } from '../stats/stats.service';
import { buildAchievements, tallyH2H, type H2HMatch } from './me.logic';

// Include padrão de um Match para montar o ponto de vista do atleta (PlayerMatch).
// A rodada pode vir direta (mata-mata) ou via grupo (fase de grupos).
const roundSelect = {
  number: true,
  kind: true,
  championship: { select: { name: true } },
} as const;
const matchInclude = {
  venue: { select: { name: true } },
  teamA: { include: { players: { include: { player: { select: { name: true } } } } } },
  teamB: { include: { players: { include: { player: { select: { name: true } } } } } },
  group: { select: { name: true, round: { select: roundSelect } } },
  round: { select: roundSelect },
} satisfies Prisma.MatchInclude;

type MatchWithView = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

/** Dados escopados ao próprio atleta autenticado (Portal do Jogador). */
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly players: PlayersService,
    private readonly stats: StatsService,
    private readonly ranking: RankingService,
    private readonly matches: MatchesService,
    private readonly knockout: KnockoutService,
  ) {}

  getProfile(clubId: string, playerId: string): Promise<PlayerDto> {
    return this.players.get(clubId, playerId);
  }

  getStats(clubId: string, playerId: string): Promise<PlayerStats> {
    return this.stats.getPlayerStats(clubId, playerId);
  }

  /** Todos os jogos do atleta (grupos + mata-mata), do ponto de vista dele. */
  async getMatches(clubId: string, playerId: string): Promise<PlayerMatch[]> {
    const teamIds = await this.myTeamIds(clubId, playerId);
    if (teamIds.length === 0) return [];
    const mineIds = new Set(teamIds);
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }] },
      include: matchInclude,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    return matches.map((m) => this.toPlayerMatch(m, mineIds));
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
      return { championshipId: null, championshipName: null, position: null, total: 0, points: 0, wins: 0, losses: 0, delta: null };
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

  // ---- Meus Torneios -----------------------------------------------------

  /** Campeonatos que o atleta participa, com sua colocação e destaques. */
  async getTournaments(clubId: string, playerId: string): Promise<MeTournamentSummary[]> {
    const teams = await this.prisma.team.findMany({
      where: { players: { some: { playerId } }, round: { championship: { season: { clubId } } } },
      select: { id: true, round: { select: { id: true, championshipId: true } } },
    });
    if (teams.length === 0) return [];

    const roundsByChamp = new Map<string, Set<string>>();
    for (const t of teams) {
      const set = roundsByChamp.get(t.round.championshipId) ?? new Set<string>();
      set.add(t.round.id);
      roundsByChamp.set(t.round.championshipId, set);
    }
    const champIds = [...roundsByChamp.keys()];

    const [champs, results] = await Promise.all([
      this.prisma.championship.findMany({
        where: { id: { in: champIds }, season: { clubId } },
        select: { id: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.roundResult.findMany({
        where: { team: { players: { some: { playerId } } }, round: { championshipId: { in: champIds } } },
        select: { finalPosition: true, round: { select: { championshipId: true, kind: true } } },
      }),
    ]);

    const summaries: MeTournamentSummary[] = [];
    for (const c of champs) {
      const ranking = await this.ranking.getRanking(clubId, c.id, 'CHAMPIONSHIP');
      const idx = ranking.entries.findIndex((e) => e.playerId === playerId);
      const mine = results.filter((r) => r.round.championshipId === c.id);
      const positions = mine.map((r) => r.finalPosition);
      summaries.push({
        championshipId: c.id,
        name: c.name,
        status: c.status,
        position: idx >= 0 ? idx + 1 : null,
        total: ranking.entries.length,
        points: idx >= 0 ? (ranking.entries[idx]?.points ?? 0) : 0,
        roundsPlayed: roundsByChamp.get(c.id)?.size ?? 0,
        bestPlacement: positions.length ? Math.min(...positions) : null,
        isChampion: mine.some((r) => r.round.kind === 'FINAL_PHASE' && r.finalPosition === 1),
      });
    }
    return summaries;
  }

  /** Detalhe de um campeonato do atleta: minhas rodadas (grupo, chave, colocação). */
  async getTournament(clubId: string, playerId: string, championshipId: string): Promise<MeTournamentDetail> {
    const champ = await this.prisma.championship.findFirst({
      where: { id: championshipId, season: { clubId } },
      select: { id: true, name: true, status: true },
    });
    const myTeams = await this.prisma.team.findMany({
      where: { players: { some: { playerId } }, round: { championshipId } },
      select: { id: true, roundId: true },
    });
    if (!champ || myTeams.length === 0) {
      throw new NotFoundException({
        error: { code: 'TOURNAMENT_NOT_FOUND', message: 'Torneio não encontrado' },
      });
    }
    const teamByRound = new Map(myTeams.map((t) => [t.roundId, t.id]));

    const rounds = await this.prisma.round.findMany({
      where: { id: { in: [...teamByRound.keys()] } },
      orderBy: { number: 'asc' },
      select: { id: true, number: true, kind: true, status: true },
    });

    const ranking = await this.ranking.getRanking(clubId, champ.id, 'CHAMPIONSHIP');
    const idx = ranking.entries.findIndex((e) => e.playerId === playerId);

    const roundViews: MeTournamentRound[] = [];
    for (const r of rounds) {
      const myTeamId = teamByRound.get(r.id)!;
      const [standings, knockout, results] = await Promise.all([
        this.matches.getStandings(clubId, r.id),
        this.knockout.getKnockout(clubId, r.id),
        this.knockout.getResult(clubId, r.id),
      ]);
      const myGroup: GroupStandings | null =
        standings.find((g) => g.standings.some((s) => s.teamId === myTeamId)) ?? null;
      const myKnockout: KnockoutMatchView[] = knockout.matches.filter(
        (m) => m.teamA?.id === myTeamId || m.teamB?.id === myTeamId,
      );
      const res = results.find((x) => x.teamId === myTeamId);
      roundViews.push({
        roundId: r.id,
        label: roundLabel({ kind: r.kind, number: r.number, championshipName: champ.name }),
        kind: r.kind,
        status: r.status,
        myTeamId,
        myGroup,
        myKnockout,
        myResult: res ? { finalPosition: res.finalPosition, pointsAwarded: res.pointsAwarded } : null,
      });
    }

    return {
      championshipId: champ.id,
      name: champ.name,
      status: champ.status,
      position: idx >= 0 ? idx + 1 : null,
      total: ranking.entries.length,
      rounds: roundViews,
    };
  }

  // ---- H2H ---------------------------------------------------------------

  /** Adversários já enfrentados pelo atleta (por nº de confrontos). */
  async getOpponents(clubId: string, playerId: string): Promise<MeOpponentSummary[]> {
    const rows = await this.prisma.opponentHistory.findMany({
      where: { clubId, OR: [{ playerAId: playerId }, { playerBId: playerId }] },
      orderBy: { timesFaced: 'desc' },
    });
    if (rows.length === 0) return [];
    const otherIds = rows.map((r) => (r.playerAId === playerId ? r.playerBId : r.playerAId));
    const names = new Map(
      (await this.prisma.player.findMany({ where: { id: { in: otherIds } }, select: { id: true, name: true } })).map(
        (p) => [p.id, p.name],
      ),
    );
    return rows.map((r) => {
      const otherId = r.playerAId === playerId ? r.playerBId : r.playerAId;
      return { playerId: otherId, playerName: names.get(otherId) ?? '?', timesFaced: r.timesFaced };
    });
  }

  /** Retrospecto direto contra um adversário (V/D + últimos jogos). */
  async getH2H(clubId: string, playerId: string, opponentId: string): Promise<MeH2H> {
    const opponent = await this.prisma.player.findFirst({
      where: { id: opponentId, clubId },
      select: { id: true, name: true },
    });
    if (!opponent) {
      throw new NotFoundException({
        error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' },
      });
    }

    const [myIds, oppIds] = await Promise.all([
      this.myTeamIds(clubId, playerId),
      this.myTeamIds(clubId, opponentId),
    ]);
    const mineSet = new Set(myIds);
    if (myIds.length === 0 || oppIds.length === 0) {
      return { opponent, wins: 0, losses: 0, total: 0, matches: [] };
    }

    const matches = await this.prisma.match.findMany({
      where: {
        status: { not: 'PENDING' },
        OR: [
          { teamAId: { in: myIds }, teamBId: { in: oppIds } },
          { teamAId: { in: oppIds }, teamBId: { in: myIds } },
        ],
      },
      include: matchInclude,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });

    const tally = tallyH2H(
      matches.map<H2HMatch>((m) => ({
        myTeamId: mineSet.has(m.teamAId) ? m.teamAId : m.teamBId,
        winnerTeamId: m.winnerTeamId,
        isWalkover: m.isWalkover,
        walkoverInjury: m.walkoverInjury,
      })),
    );

    return {
      opponent,
      wins: tally.wins,
      losses: tally.losses,
      total: tally.wins + tally.losses,
      matches: matches.map((m) => this.toPlayerMatch(m, mineSet)),
    };
  }

  // ---- Conquistas --------------------------------------------------------

  async getAchievements(clubId: string, playerId: string): Promise<MeAchievement[]> {
    const stats = await this.stats.getPlayerStats(clubId, playerId);
    return buildAchievements(stats);
  }

  // ---- helpers -----------------------------------------------------------

  private async myTeamIds(clubId: string, playerId: string): Promise<string[]> {
    const teams = await this.prisma.team.findMany({
      where: { players: { some: { playerId } }, round: { championship: { season: { clubId } } } },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }

  private toPlayerMatch(m: MatchWithView, mineIds: Set<string>): PlayerMatch {
    const aIsMine = mineIds.has(m.teamAId);
    const mine = aIsMine ? m.teamA : m.teamB;
    const opp = aIsMine ? m.teamB : m.teamA;
    const myTeamId = aIsMine ? m.teamAId : m.teamBId;
    const didIWin = m.winnerTeamId ? m.winnerTeamId === myTeamId : null;
    const round = m.round ?? m.group?.round ?? null;
    const champName = round?.championship.name ?? null;
    return {
      id: m.id,
      championshipName: champName ?? '',
      roundLabel: round
        ? roundLabel({ kind: round.kind, number: round.number, championshipName: champName })
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
  }

  private async rankingDelta(
    clubId: string,
    championshipId: string,
    playerId: string,
    currentPosition: number | null,
  ): Promise<number | null> {
    if (currentPosition === null) return null;
    const evolution = await this.ranking.getEvolution(clubId, championshipId);
    if (evolution.rounds.length < 2) return null;
    const prevIdx = evolution.rounds.length - 2;
    const standingsPrev = evolution.players
      .map((p) => ({ playerId: p.playerId, points: p.cumulative[prevIdx] ?? 0 }))
      .sort((a, b) => b.points - a.points);
    const prevPos = standingsPrev.findIndex((p) => p.playerId === playerId) + 1;
    if (prevPos === 0) return null;
    return prevPos - currentPosition;
  }

  private teamRef(
    id: string,
    team: { label: string; players: { player: { name: string } }[] },
  ): MatchTeamRef {
    const names = team.players.map((p) => p.player.name);
    return { id, label: team.label, playerNames: [names[0] ?? '?', names[1] ?? '?'] };
  }
}
