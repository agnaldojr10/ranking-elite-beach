import { z } from 'zod';

/** Papéis de acesso (RBAC) — espelha o enum Role do Prisma. */
export const RoleSchema = z.enum(['ADMIN', 'ORGANIZER', 'PLAYER', 'VIEWER']);
export type Role = z.infer<typeof RoleSchema>;

/** Formato padrão de erro da API. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
