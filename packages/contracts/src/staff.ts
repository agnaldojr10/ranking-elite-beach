import { z } from 'zod';
import { RoleSchema } from './common';

/**
 * Gestão de equipe (backoffice): a organização pode ter mais de um responsável.
 * Só papéis de staff são criados aqui — atletas entram pelo Portal (convite).
 */
export const StaffRoleSchema = z.enum(['ADMIN', 'ORGANIZER']);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Administrador',
  ORGANIZER: 'Organizador',
};

/** Descrição do que cada papel pode fazer (exibido no formulário). */
export const STAFF_ROLE_HINTS: Record<StaffRole, string> = {
  ADMIN: 'Acesso total, incluindo gerenciar a equipe.',
  ORGANIZER: 'Opera campeonatos e rodadas; não gerencia a equipe.',
};

export const CreateStaffUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
  role: StaffRoleSchema.default('ADMIN'),
});
export type CreateStaffUser = z.infer<typeof CreateStaffUserSchema>;

export const UpdateStaffUserSchema = z
  .object({
    isActive: z.boolean(),
    role: StaffRoleSchema,
  })
  .partial();
export type UpdateStaffUser = z.infer<typeof UpdateStaffUserSchema>;

/** Membro da equipe exposto ao backoffice (sem hash de senha). */
export const StaffUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type StaffUser = z.infer<typeof StaffUserSchema>;
