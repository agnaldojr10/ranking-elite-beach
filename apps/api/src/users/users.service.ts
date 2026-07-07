import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { AuthUser, CreateStaffUser, StaffRole, StaffUser, UpdateStaffUser } from '@reb/contracts';
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

  // ---- Gestão de equipe (staff ADMIN/ORGANIZER) --------------------------

  /** Lista os membros da equipe do clube (não inclui atletas). */
  async listStaff(clubId: string): Promise<StaffUser[]> {
    const users = await this.prisma.user.findMany({
      where: { clubId, role: { in: ['ADMIN', 'ORGANIZER'] } },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
    return users.map((u) => this.toStaffUser(u));
  }

  /** Cria um membro da equipe (ADMIN/ORGANIZER) com senha própria. */
  async createStaff(clubId: string, dto: CreateStaffUser): Promise<StaffUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: await argon2.hash(dto.password),
          clubId,
          role: dto.role,
        },
      });
      return this.toStaffUser(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          error: { code: 'EMAIL_EXISTS', message: 'Já existe um usuário com este e-mail' },
        });
      }
      throw e;
    }
  }

  /** Atualiza papel/ativação de um membro da equipe (não permite se auto-rebaixar/desativar). */
  async updateStaff(
    clubId: string,
    targetId: string,
    actingUserId: string,
    dto: UpdateStaffUser,
  ): Promise<StaffUser> {
    const target = await this.prisma.user.findFirst({
      where: { id: targetId, clubId, role: { in: ['ADMIN', 'ORGANIZER'] } },
    });
    if (!target) {
      throw new NotFoundException({
        error: { code: 'STAFF_NOT_FOUND', message: 'Membro da equipe não encontrado' },
      });
    }
    if (target.id === actingUserId && (dto.isActive === false || dto.role === 'ORGANIZER')) {
      throw new BadRequestException({
        error: { code: 'CANNOT_DEMOTE_SELF', message: 'Você não pode desativar ou rebaixar a si mesmo' },
      });
    }
    // Não deixa a organização ficar sem nenhum admin ativo.
    if (dto.isActive === false || dto.role === 'ORGANIZER') {
      await this.assertNotLastActiveAdmin(clubId, target);
    }
    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.role ? { role: dto.role } : {}),
      },
    });
    return this.toStaffUser(updated);
  }

  private async assertNotLastActiveAdmin(clubId: string, target: User): Promise<void> {
    if (target.role !== 'ADMIN' || !target.isActive) return;
    const activeAdmins = await this.prisma.user.count({
      where: { clubId, role: 'ADMIN', isActive: true },
    });
    if (activeAdmins <= 1) {
      throw new ForbiddenException({
        error: {
          code: 'LAST_ACTIVE_ADMIN',
          message: 'A organização precisa de ao menos um administrador ativo',
        },
      });
    }
  }

  private toStaffUser(user: User): StaffUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role as StaffRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
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
