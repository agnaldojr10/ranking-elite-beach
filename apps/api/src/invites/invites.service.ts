import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { InviteResponse } from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';

/** Convite de uso único para um atleta reivindicar sua conta no Portal do Jogador. */
@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Gera um convite para um Player do clube. O código em claro só é retornado aqui. */
  async generate(clubId: string, playerId: string, createdById: string): Promise<InviteResponse> {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, clubId },
      select: { id: true, user: { select: { id: true } } },
    });
    if (!player) {
      throw new NotFoundException({
        error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' },
      });
    }
    if (player.user) {
      throw new ConflictException({
        error: { code: 'PLAYER_ALREADY_CLAIMED', message: 'Este jogador já possui acesso ao portal' },
      });
    }

    const code = InvitesService.newCode();
    const ttlDays = this.config.get<number>('INVITE_TTL_DAYS') ?? 14;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.playerInvite.create({
      data: {
        clubId,
        playerId,
        codeHash: InvitesService.hashCode(code),
        expiresAt,
        createdById,
      },
    });

    return { code, expiresAt: expiresAt.toISOString() };
  }

  /** Valida o código e retorna o convite ativo (não usado e não expirado). */
  async findValidByCode(code: string): Promise<{ id: string; playerId: string; clubId: string }> {
    const invite = await this.prisma.playerInvite.findUnique({
      where: { codeHash: InvitesService.hashCode(code.trim()) },
      select: { id: true, playerId: true, clubId: true, usedAt: true, expiresAt: true },
    });
    if (!invite) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_INVITE', message: 'Convite inválido' },
      });
    }
    if (invite.usedAt) {
      throw new ConflictException({
        error: { code: 'INVITE_USED', message: 'Convite já utilizado' },
      });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new ConflictException({
        error: { code: 'INVITE_EXPIRED', message: 'Convite expirado' },
      });
    }
    return { id: invite.id, playerId: invite.playerId, clubId: invite.clubId };
  }

  /** SHA-256 determinístico (o código é aleatório de alta entropia — não precisa de argon2). */
  static hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /** Código legível estilo ABCD-EFGH-JKMN (Crockford, sem caracteres ambíguos). */
  static newCode(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
    const bytes = randomBytes(12);
    let out = '';
    for (let i = 0; i < 12; i++) {
      out += alphabet[bytes[i]! % alphabet.length];
      if (i % 4 === 3 && i < 11) out += '-';
    }
    return out;
  }
}
