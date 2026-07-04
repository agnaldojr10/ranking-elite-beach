import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Fakes mínimos das dependências (sem Nest DI nem banco).
function makeAuth(overrides: {
  findByEmail?: () => Promise<unknown>;
  findValidByCode?: () => Promise<{ id: string; playerId: string; clubId: string }>;
} = {}) {
  const users = {
    findByEmail: overrides.findByEmail ?? (async () => null),
    createAthlete: vi.fn(
      async (_input: {
        email: string;
        passwordHash: string;
        clubId: string;
        playerId: string;
        inviteId: string;
      }) => ({
        id: 'user-1',
        email: 'atleta@x.com',
        role: 'PLAYER',
        clubId: 'club-1',
        playerId: 'player-1',
      }),
    ),
  };
  const invites = {
    findValidByCode:
      overrides.findValidByCode ??
      (async () => ({ id: 'inv-1', playerId: 'player-1', clubId: 'club-1' })),
  };
  const jwt = { signAsync: vi.fn(async () => 'signed.jwt.token') };
  const config = { getOrThrow: () => 'secret' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = new AuthService(users as any, jwt as any, config as any, invites as any);
  return { auth, users, invites, jwt };
}

describe('AuthService.claim', () => {
  const dto = { code: 'ABCD-EFGH-JKMN', email: 'Atleta@X.com', password: 'segredo123' };

  it('cria o atleta e retorna tokens + usuário PLAYER', async () => {
    const { auth, users } = makeAuth();
    const res = await auth.claim(dto);
    expect(res.user.role).toBe('PLAYER');
    expect(res.user.playerId).toBe('player-1');
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    // Consome o convite e passa o hash (não a senha em claro) ao criar.
    expect(users.createAthlete).toHaveBeenCalledOnce();
    const arg = users.createAthlete.mock.calls[0]![0];
    expect(arg.inviteId).toBe('inv-1');
    expect(arg.passwordHash).not.toContain('segredo123');
  });

  it('rejeita quando o e-mail já existe (não cria)', async () => {
    const { auth, users } = makeAuth({ findByEmail: async () => ({ id: 'u0' }) });
    await expect(auth.claim(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(users.createAthlete).not.toHaveBeenCalled();
  });

  it('propaga erro de convite inválido', async () => {
    const { auth, users } = makeAuth({
      findValidByCode: async () => {
        throw new ConflictException('nope');
      },
    });
    await expect(auth.claim(dto)).rejects.toBeTruthy();
    expect(users.createAthlete).not.toHaveBeenCalled();
  });
});
