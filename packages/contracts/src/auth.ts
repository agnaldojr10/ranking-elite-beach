import { z } from 'zod';
import { RoleSchema } from './common';

/** Credenciais de login. */
export const LoginRequestSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Usuário autenticado exposto ao frontend (sem dados sensíveis). */
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  clubId: z.string().uuid(),
  playerId: z.string().uuid().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

/** Par de tokens emitido no login/refresh. */
export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export const LoginResponseSchema = TokenPairSchema.extend({
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

/** Payload assinado dentro do JWT. */
export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  clubId: z.string().uuid(),
  // Presente quando o usuário é um atleta (login do Portal do Jogador).
  playerId: z.string().uuid().nullable().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
