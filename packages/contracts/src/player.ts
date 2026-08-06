import { z } from 'zod';

export const SkillLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']);
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

export const PlayerStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;

/**
 * Tipo do jogador para efeito de ranking:
 * - REGULAR: participa e pontua normalmente.
 * - GUEST (convidado): joga para completar o chaveamento, mas NÃO pontua e NÃO
 *   aparece no ranking (ex.: professor entrando só para fechar as duplas). Não
 *   afeta a pontuação do parceiro: se a dupla tem um regular, ele pontua normal.
 */
export const PlayerTypeSchema = z.enum(['REGULAR', 'GUEST']);
export type PlayerType = z.infer<typeof PlayerTypeSchema>;

/** Rótulos em pt-BR para exibição. */
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  PRO: 'Profissional',
};

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

export const PLAYER_TYPE_LABELS: Record<PlayerType, string> = {
  REGULAR: 'Normal',
  GUEST: 'Convidado',
};

/** Data no formato YYYY-MM-DD. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Data inválida');

export const CreatePlayerSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  photoUrl: z.string().url('URL inválida').max(2048).optional().or(z.literal('')),
  birthDate: dateOnly,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  skillLevel: SkillLevelSchema.default('INTERMEDIATE'),
  status: PlayerStatusSchema.default('ACTIVE'),
  type: PlayerTypeSchema.default('REGULAR'),
});
export type CreatePlayer = z.infer<typeof CreatePlayerSchema>;

export const UpdatePlayerSchema = CreatePlayerSchema.partial();
export type UpdatePlayer = z.infer<typeof UpdatePlayerSchema>;

/**
 * Cadastro rápido pelo Portal, durante a operação da rodada: só o nome (+ tipo).
 * Os demais dados entram com padrão e podem ser completados depois no backoffice.
 */
export const QuickAddPlayerSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  type: PlayerTypeSchema.default('REGULAR'),
});
export type QuickAddPlayer = z.infer<typeof QuickAddPlayerSchema>;

export const UpdatePlayerStatusSchema = z.object({ status: PlayerStatusSchema });
export type UpdatePlayerStatus = z.infer<typeof UpdatePlayerStatusSchema>;

export const PlayerQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: PlayerStatusSchema.optional(),
  level: SkillLevelSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PlayerQuery = z.infer<typeof PlayerQuerySchema>;

export const PlayerSchema = z.object({
  id: z.string().uuid(),
  clubId: z.string().uuid(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  birthDate: z.string(), // YYYY-MM-DD
  age: z.number().int().nonnegative(),
  phone: z.string().nullable(),
  skillLevel: SkillLevelSchema,
  status: PlayerStatusSchema,
  type: PlayerTypeSchema,
  createdAt: z.string(),
  /** E-mail da conta do Portal do Jogador, se o atleta já reivindicou (senão null). */
  accountEmail: z.string().nullable(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const PaginatedPlayersSchema = z.object({
  data: z.array(PlayerSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type PaginatedPlayers = z.infer<typeof PaginatedPlayersSchema>;

/** Calcula a idade (anos completos) a partir de uma data de nascimento. */
export function computeAge(birthDate: Date | string, now: Date = new Date()): number {
  const b = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
