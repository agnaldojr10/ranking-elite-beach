import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '@reb/contracts';
import { Prisma, type User } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Cria o usuário-atleta (role PLAYER) vinculado ao Player e consome o convite,
   * numa única transação. O `playerId` é único (um login por atleta).
   */
  async createAthlete(input: {
    email: string;
    passwordHash: string;
    clubId: string;
    playerId: string;
    inviteId: string;
  }): Promise<User> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email.toLowerCase(),
            passwordHash: input.passwordHash,
            clubId: input.clubId,
            playerId: input.playerId,
            role: 'PLAYER',
          },
        });
        await tx.playerInvite.update({
          where: { id: input.inviteId },
          data: { usedAt: new Date() },
        });
        return user;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta?.target as string[] | undefined)?.join(',') ?? '';
        if (target.includes('player_id')) {
          throw new ConflictException({
            error: { code: 'PLAYER_ALREADY_CLAIMED', message: 'Este jogador já possui acesso ao portal' },
          });
        }
        throw new ConflictException({
          error: { code: 'EMAIL_EXISTS', message: 'E-mail já cadastrado' },
        });
      }
      throw e;
    }
  }

  /** Converte o registro do banco no formato público (sem hash de senha). */
  async toAuthUser(id: string): Promise<AuthUser | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      playerId: user.playerId,
    };
  }
}
