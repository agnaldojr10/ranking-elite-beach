import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computeAge,
  type CreatePlayer,
  type PaginatedPlayers,
  type Player as PlayerDto,
  type PlayerQuery,
  type PlayerStatus,
  type UpdatePlayer,
} from '@reb/contracts';
import type { Player } from '@reb/db';
import { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: string, query: PlayerQuery): Promise<PaginatedPlayers> {
    const where: Prisma.PlayerWhereInput = {
      clubId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.level ? { skillLevel: query.level } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      data: rows.map((p) => this.toDto(p)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async get(clubId: string, id: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findFirst({ where: { id, clubId } });
    if (!player) throw this.notFound();
    return this.toDto(player);
  }

  async create(clubId: string, dto: CreatePlayer): Promise<PlayerDto> {
    const player = await this.prisma.player.create({
      data: {
        clubId,
        name: dto.name,
        photoUrl: dto.photoUrl ? dto.photoUrl : null,
        birthDate: new Date(dto.birthDate),
        phone: dto.phone ? dto.phone : null,
        skillLevel: dto.skillLevel,
        status: dto.status,
        type: dto.type,
      },
    });
    return this.toDto(player);
  }

  async update(clubId: string, id: string, dto: UpdatePlayer): Promise<PlayerDto> {
    await this.ensureExists(clubId, id);
    const player = await this.prisma.player.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl ? dto.photoUrl : null } : {}),
        ...(dto.birthDate !== undefined ? { birthDate: new Date(dto.birthDate) } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone ? dto.phone : null } : {}),
        ...(dto.skillLevel !== undefined ? { skillLevel: dto.skillLevel } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
      },
    });
    return this.toDto(player);
  }

  async setStatus(clubId: string, id: string, status: PlayerStatus): Promise<PlayerDto> {
    await this.ensureExists(clubId, id);
    const player = await this.prisma.player.update({ where: { id }, data: { status } });
    return this.toDto(player);
  }

  private async ensureExists(clubId: string, id: string): Promise<void> {
    const exists = await this.prisma.player.findFirst({ where: { id, clubId }, select: { id: true } });
    if (!exists) throw this.notFound();
  }

  private toDto(p: Player): PlayerDto {
    const birthDate = p.birthDate.toISOString().slice(0, 10);
    return {
      id: p.id,
      clubId: p.clubId,
      name: p.name,
      photoUrl: p.photoUrl,
      birthDate,
      age: computeAge(birthDate),
      phone: p.phone,
      skillLevel: p.skillLevel,
      status: p.status,
      type: p.type,
      createdAt: p.createdAt.toISOString(),
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' },
    });
  }
}
