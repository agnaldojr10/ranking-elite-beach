import { Injectable, NotFoundException } from '@nestjs/common';
import {
  rankPlayers,
  type Ranking,
  type RankingEvolution,
  type RankingRow,
  type RankingScope,
  type SetScore,
} from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';

type Acc = {
  playerName: string;
  points: number;
  rounds: Set<string>;
  wins: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
};

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getRanking(clubId: string, championshipId: string, scope: RankingScope): Promise<Ranking> {
    const roundIds = await this.resolveRoundIds(clubId, championshipId, scope);
    if (roundIds.length === 0) return { scope, entries: [] };

    const acc = new Map<string, Acc>();
    const touch = (id: string, name: string): Acc => {
      let a = acc.get(id);
      if (!a) {
        a = { playerName: name, points: 0, rounds: new Set(), wins: 0, losses: 0, gamesFor: 0, gamesAgainst: 0 };
        acc.set(id, a);
      }
      return a;
    };

    // Pontos por colocação (RoundResult) creditados aos 2 jogadores da dupla.
    const results = await this.prisma.roundResult.findMany({
      where: { roundId: { in: roundIds } },
      include: { team: { include: { players: { include: { player: { select: { id: true, name: true } } } } } } },
    });
    for (const r of results) {
      for (const tp of r.team.players) {
        const a = touch(tp.player.id, tp.player.name);
        a.points += r.pointsAwarded;
        a.rounds.add(r.roundId);
      }
    }

    // Vitórias/derrotas e saldo de games (Match). W.O. por lesão não penaliza o lesionado (BR-32).
    const matches = await this.prisma.match.findMany({
      where: {
        status: { not: 'PENDING' },
        OR: [{ group: { roundId: { in: roundIds } } }, { roundId: { in: roundIds } }],
      },
      include: {
        teamA: { include: { players: { include: { player: { select: { id: true, name: true } } } } } },
        teamB: { include: { players: { include: { player: { select: { id: true, name: true } } } } } },
      },
    });
    for (const m of matches) {
      if (!m.winnerTeamId) continue;
      const games = this.gamesOf(m.sets as SetScore[] | null);
      const aWon = m.winnerTeamId === m.teamAId;
      const winners = aWon ? m.teamA.players : m.teamB.players;
      const losers = aWon ? m.teamB.players : m.teamA.players;
      const winGames = aWon ? games.a : games.b;
      const loseGames = aWon ? games.b : games.a;

      for (const tp of winners) {
        const a = touch(tp.player.id, tp.player.name);
        a.wins += 1;
        a.gamesFor += winGames;
        a.gamesAgainst += loseGames;
      }
      // BR-32: derrota por W.O. de lesão não conta para o lesionado (dupla perdedora).
      if (m.isWalkover && m.walkoverInjury) continue;
      for (const tp of losers) {
        const a = touch(tp.player.id, tp.player.name);
        a.losses += 1;
        a.gamesFor += loseGames;
        a.gamesAgainst += winGames;
      }
    }

    const rows: RankingRow[] = [...acc.entries()].map(([playerId, a]) => ({
      playerId,
      playerName: a.playerName,
      points: a.points,
      rounds: a.rounds.size,
      wins: a.wins,
      losses: a.losses,
      gamesBalance: a.gamesFor - a.gamesAgainst,
    }));

    return { scope, entries: rankPlayers(rows) };
  }

  async getEvolution(clubId: string, championshipId: string): Promise<RankingEvolution> {
    await this.ensureChampionship(clubId, championshipId);
    const rounds = await this.prisma.round.findMany({
      where: { championshipId, status: 'FINISHED', kind: 'REGULAR' },
      orderBy: { number: 'asc' },
      select: { id: true, number: true },
    });
    if (rounds.length === 0) return { rounds: [], players: [] };

    const results = await this.prisma.roundResult.findMany({
      where: { roundId: { in: rounds.map((r) => r.id) } },
      include: { team: { include: { players: { include: { player: { select: { id: true, name: true } } } } } } },
    });

    // pontos por (jogador, rodada)
    const names = new Map<string, string>();
    const perRound = new Map<string, Map<string, number>>(); // playerId → roundId → pontos
    for (const r of results) {
      for (const tp of r.team.players) {
        names.set(tp.player.id, tp.player.name);
        const byRound = perRound.get(tp.player.id) ?? new Map<string, number>();
        byRound.set(r.roundId, (byRound.get(r.roundId) ?? 0) + r.pointsAwarded);
        perRound.set(tp.player.id, byRound);
      }
    }

    const players = [...perRound.entries()]
      .map(([playerId, byRound]) => {
        let sum = 0;
        const cumulative = rounds.map((r) => {
          sum += byRound.get(r.id) ?? 0;
          return sum;
        });
        return { playerId, playerName: names.get(playerId) ?? '?', cumulative };
      })
      .sort((a, b) => (b.cumulative.at(-1) ?? 0) - (a.cumulative.at(-1) ?? 0));

    return { rounds: rounds.map((r) => r.number), players };
  }

  // ---- helpers -----------------------------------------------------------

  private gamesOf(sets: SetScore[] | null): { a: number; b: number } {
    if (!sets) return { a: 0, b: 0 };
    return sets.reduce((acc, s) => ({ a: acc.a + s.a, b: acc.b + s.b }), { a: 0, b: 0 });
  }

  private async ensureChampionship(clubId: string, championshipId: string): Promise<{ seasonId: string }> {
    const champ = await this.prisma.championship.findFirst({
      where: { id: championshipId, season: { clubId } },
      select: { seasonId: true },
    });
    if (!champ) {
      throw new NotFoundException({
        error: { code: 'CHAMPIONSHIP_NOT_FOUND', message: 'Campeonato não encontrado' },
      });
    }
    return champ;
  }

  private async resolveRoundIds(
    clubId: string,
    championshipId: string,
    scope: RankingScope,
  ): Promise<string[]> {
    const champ = await this.ensureChampionship(clubId, championshipId);
    const scopeWhere =
      scope === 'CHAMPIONSHIP'
        ? { championshipId }
        : scope === 'SEASON'
          ? { championship: { seasonId: champ.seasonId } }
          : { championship: { season: { clubId } } };
    // Ranking = temporada regular: exclui a fase final (BR-34).
    const rounds = await this.prisma.round.findMany({
      where: { ...scopeWhere, kind: 'REGULAR' },
      select: { id: true },
    });
    return rounds.map((r) => r.id);
  }
}
