import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_MATCH_FORMAT,
  MatchFormatSchema,
  RegistrationSchema,
  computeRoundReadiness,
  type CreateRound,
  type MatchFormat,
  type Registration as RegistrationDto,
  type RegistrationStatus,
  type RegistrationSummary,
  type Round as RoundDto,
  type RoundKind,
  type RoundStatus,
  type UpdateRound,
} from '@reb/contracts';
import { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

/** Inclui a inscrição com os dados do jogador usados no DTO de resposta. */
const registrationInclude = {
  player: {
    select: { id: true, name: true, photoUrl: true, skillLevel: true, status: true },
  },
} satisfies Prisma.RegistrationInclude;

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: string, championshipId: string): Promise<RoundDto[]> {
    await this.ensureChampionship(clubId, championshipId);
    const rows = await this.prisma.round.findMany({
      where: { championshipId },
      orderBy: { number: 'asc' },
      include: {
        registrations: { select: { status: true } },
        championship: { select: { name: true } },
      },
    });
    return rows.map((r) =>
      this.toDto(r, this.summarize(r.registrations.map((x) => x.status))),
    );
  }

  async get(clubId: string, id: string): Promise<RoundDto> {
    const row = await this.prisma.round.findFirst({
      where: { id, championship: { season: { clubId } } },
      include: {
        registrations: { include: registrationInclude, orderBy: { createdAt: 'asc' } },
        championship: { select: { name: true } },
      },
    });
    if (!row) throw this.notFound();

    const summary = this.summarize(row.registrations.map((x) => x.status));
    const registrations: RegistrationDto[] = row.registrations.map((r) => this.toRegistrationDto(r));
    return this.toDto(row, summary, registrations);
  }

  async create(clubId: string, championshipId: string, dto: CreateRound): Promise<RoundDto> {
    const champ = await this.ensureChampionship(clubId, championshipId);
    if (champ.status === 'FINISHED') {
      throw new ConflictException({
        error: {
          code: 'CHAMPIONSHIP_FINISHED',
          message: 'Não é possível criar rodadas em um campeonato encerrado',
        },
      });
    }

    const number = dto.number ?? (await this.nextNumber(championshipId));
    const clash = await this.prisma.round.findFirst({
      where: { championshipId, number },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException({
        error: { code: 'ROUND_NUMBER_EXISTS', message: `Já existe a rodada nº ${number}` },
      });
    }

    const matchFormat = this.mergeMatchFormat(dto.matchFormat);
    const created = await this.prisma.round.create({
      data: {
        championshipId,
        number,
        date: dto.date ? new Date(dto.date) : null,
        kind: dto.kind,
        groupSizePref: dto.groupSizePref,
        matchFormat: matchFormat as unknown as Prisma.InputJsonValue,
      },
      include: {
        registrations: { select: { status: true } },
        championship: { select: { name: true } },
      },
    });
    return this.toDto(created, this.summarize(created.registrations.map((x) => x.status)));
  }

  async updateBasics(clubId: string, id: string, dto: UpdateRound): Promise<RoundDto> {
    const round = await this.prisma.round.findFirst({
      where: { id, championship: { season: { clubId } } },
      select: { id: true, championshipId: true, matchFormat: true },
    });
    if (!round) throw this.notFound();

    if (dto.number !== undefined) {
      const clash = await this.prisma.round.findFirst({
        where: { championshipId: round.championshipId, number: dto.number, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException({
          error: { code: 'ROUND_NUMBER_EXISTS', message: `Já existe a rodada nº ${dto.number}` },
        });
      }
    }

    const data: Prisma.RoundUpdateInput = {};
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.date !== undefined) data.date = dto.date ? new Date(dto.date) : null;
    if (dto.groupSizePref !== undefined) data.groupSizePref = dto.groupSizePref;
    if (dto.matchFormat !== undefined) {
      const current = MatchFormatSchema.parse(round.matchFormat);
      data.matchFormat = { ...current, ...dto.matchFormat } as unknown as Prisma.InputJsonValue;
    }

    await this.prisma.round.update({ where: { id }, data });
    return this.get(clubId, id);
  }

  async setStatus(clubId: string, id: string, target: RoundStatus): Promise<RoundDto> {
    const round = await this.prisma.round.findFirst({
      where: { id, championship: { season: { clubId } } },
      select: { id: true, status: true },
    });
    if (!round) throw this.notFound();

    // Sprint 4: abertura/fechamento de inscrições. DRAWN em diante entra com o sorteio (Sprint 5).
    const allowed: Partial<Record<RoundStatus, RoundStatus[]>> = {
      SCHEDULED: ['OPEN'],
      OPEN: ['SCHEDULED'],
    };
    if (!(allowed[round.status] ?? []).includes(target)) {
      throw new ConflictException({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Transição de ${round.status} para ${target} não é permitida nesta fase`,
        },
      });
    }

    await this.prisma.round.update({ where: { id }, data: { status: target } });
    return this.get(clubId, id);
  }

  // ---- helpers -----------------------------------------------------------

  private async ensureChampionship(
    clubId: string,
    championshipId: string,
  ): Promise<{ id: string; status: string }> {
    const champ = await this.prisma.championship.findFirst({
      where: { id: championshipId, season: { clubId } },
      select: { id: true, status: true },
    });
    if (!champ) {
      throw new NotFoundException({
        error: { code: 'CHAMPIONSHIP_NOT_FOUND', message: 'Campeonato não encontrado' },
      });
    }
    return champ;
  }

  private async nextNumber(championshipId: string): Promise<number> {
    const last = await this.prisma.round.findFirst({
      where: { championshipId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return (last?.number ?? 0) + 1;
  }

  private mergeMatchFormat(partial?: Partial<MatchFormat>): MatchFormat {
    return MatchFormatSchema.parse({ ...DEFAULT_MATCH_FORMAT, ...(partial ?? {}) });
  }

  private summarize(statuses: RegistrationStatus[]): RegistrationSummary {
    const s: RegistrationSummary = { confirmed: 0, pending: 0, absent: 0, waitlist: 0, total: statuses.length };
    for (const st of statuses) {
      if (st === 'CONFIRMED') s.confirmed++;
      else if (st === 'PENDING') s.pending++;
      else if (st === 'ABSENT') s.absent++;
      else if (st === 'WAITLIST') s.waitlist++;
    }
    return s;
  }

  private toDto(
    row: {
      id: string;
      championshipId: string;
      championship: { name: string };
      number: number;
      date: Date | null;
      status: RoundStatus;
      kind: RoundKind;
      matchFormat: Prisma.JsonValue;
      groupSizePref: number;
      createdAt: Date;
    },
    summary: RegistrationSummary,
    registrations?: RegistrationDto[],
  ): RoundDto {
    return {
      id: row.id,
      championshipId: row.championshipId,
      championshipName: row.championship.name,
      number: row.number,
      date: row.date ? row.date.toISOString().slice(0, 10) : null,
      status: row.status,
      kind: row.kind,
      matchFormat: MatchFormatSchema.parse(row.matchFormat),
      groupSizePref: row.groupSizePref,
      createdAt: row.createdAt.toISOString(),
      summary,
      readiness: computeRoundReadiness(summary.confirmed),
      ...(registrations ? { registrations } : {}),
    };
  }

  private toRegistrationDto(row: {
    id: string;
    roundId: string;
    status: RegistrationStatus;
    substitutedById: string | null;
    createdAt: Date;
    player: {
      id: string;
      name: string;
      photoUrl: string | null;
      skillLevel: RegistrationDto['player']['skillLevel'];
      status: RegistrationDto['player']['status'];
    };
  }): RegistrationDto {
    return RegistrationSchema.parse({
      id: row.id,
      roundId: row.roundId,
      status: row.status,
      substitutedById: row.substitutedById,
      player: {
        id: row.player.id,
        name: row.player.name,
        photoUrl: row.player.photoUrl,
        skillLevel: row.player.skillLevel,
        status: row.player.status,
      },
      createdAt: row.createdAt.toISOString(),
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
    });
  }
}
