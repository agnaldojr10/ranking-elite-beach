import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  RegistrationSchema,
  type BulkCreateRegistration,
  type CreateRegistration,
  type Registration as RegistrationDto,
  type UpdateRegistration,
} from '@reb/contracts';
import { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

const registrationInclude = {
  player: {
    select: { id: true, name: true, photoUrl: true, skillLevel: true, status: true },
  },
} satisfies Prisma.RegistrationInclude;

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clubId: string, roundId: string, dto: CreateRegistration): Promise<RegistrationDto> {
    const round = await this.prisma.round.findFirst({
      where: { id: roundId, championship: { season: { clubId } } },
      select: { id: true, status: true },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    if (round.status === 'FINISHED') {
      throw new ConflictException({
        error: { code: 'ROUND_CLOSED', message: 'A rodada está encerrada' },
      });
    }

    const player = await this.prisma.player.findFirst({
      where: { id: dto.playerId, clubId },
      select: { id: true, status: true },
    });
    if (!player) {
      throw new ConflictException({
        error: { code: 'PLAYER_INVALID', message: 'Jogador inválido para este clube' },
      });
    }
    // BR-03: jogador inativo não pode ser inscrito.
    if (player.status === 'INACTIVE') {
      throw new UnprocessableEntityException({
        error: { code: 'PLAYER_INACTIVE', message: 'Jogador inativo não pode ser inscrito' },
      });
    }

    const dup = await this.prisma.registration.findFirst({
      where: { roundId, playerId: dto.playerId },
      select: { id: true },
    });
    if (dup) {
      throw new ConflictException({
        error: { code: 'REGISTRATION_EXISTS', message: 'Jogador já inscrito nesta rodada' },
      });
    }

    const created = await this.prisma.registration.create({
      data: { roundId, playerId: dto.playerId, status: dto.status },
      include: registrationInclude,
    });
    return this.toDto(created);
  }

  /**
   * Inscreve vários jogadores de uma vez. Ignora quem já está inscrito (dedupe),
   * inválido para o clube ou inativo (BR-03). Retorna quantos foram adicionados.
   */
  async createMany(
    clubId: string,
    roundId: string,
    dto: BulkCreateRegistration,
  ): Promise<{ added: number }> {
    const round = await this.prisma.round.findFirst({
      where: { id: roundId, championship: { season: { clubId } } },
      select: { id: true, status: true },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    if (round.status === 'FINISHED') {
      throw new ConflictException({
        error: { code: 'ROUND_CLOSED', message: 'A rodada está encerrada' },
      });
    }

    const ids = [...new Set(dto.playerIds)];
    // Só jogadores válidos do clube e ATIVOS (BR-03).
    const valid = await this.prisma.player.findMany({
      where: { id: { in: ids }, clubId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (valid.length === 0) return { added: 0 };

    const result = await this.prisma.registration.createMany({
      data: valid.map((p) => ({ roundId, playerId: p.id, status: dto.status })),
      skipDuplicates: true,
    });
    return { added: result.count };
  }

  async update(clubId: string, id: string, dto: UpdateRegistration): Promise<RegistrationDto> {
    const reg = await this.prisma.registration.findFirst({
      where: { id, round: { championship: { season: { clubId } } } },
      select: { id: true, roundId: true, playerId: true },
    });
    if (!reg) throw this.notFound();

    const data: Prisma.RegistrationUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.substitutedById !== undefined) {
      if (dto.substitutedById === null) {
        data.substitutedBy = { disconnect: true };
      } else {
        if (dto.substitutedById === reg.playerId) {
          throw new ConflictException({
            error: {
              code: 'INVALID_SUBSTITUTE',
              message: 'O substituto deve ser diferente do jogador inscrito',
            },
          });
        }
        const sub = await this.prisma.player.findFirst({
          where: { id: dto.substitutedById, clubId },
          select: { id: true, status: true },
        });
        if (!sub) {
          throw new ConflictException({
            error: { code: 'PLAYER_INVALID', message: 'Substituto inválido para este clube' },
          });
        }
        if (sub.status === 'INACTIVE') {
          throw new UnprocessableEntityException({
            error: { code: 'PLAYER_INACTIVE', message: 'Substituto inativo não pode assumir a vaga' },
          });
        }
        data.substitutedBy = { connect: { id: dto.substitutedById } };
      }
    }

    const updated = await this.prisma.registration.update({
      where: { id },
      data,
      include: registrationInclude,
    });
    return this.toDto(updated);
  }

  async remove(clubId: string, id: string): Promise<{ ok: true }> {
    const reg = await this.prisma.registration.findFirst({
      where: { id, round: { championship: { season: { clubId } } } },
      select: { id: true },
    });
    if (!reg) throw this.notFound();
    await this.prisma.registration.delete({ where: { id } });
    return { ok: true };
  }

  private toDto(row: {
    id: string;
    roundId: string;
    status: RegistrationDto['status'];
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
      error: { code: 'REGISTRATION_NOT_FOUND', message: 'Inscrição não encontrada' },
    });
  }
}
