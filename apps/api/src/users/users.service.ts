import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@reb/contracts';
import type { User } from '@reb/db';
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
