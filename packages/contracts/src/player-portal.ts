import { z } from 'zod';
import { MatchStatusSchema } from './draw';
import { MatchTeamRefSchema, SetScoreSchema } from './match';

// ---------------------------------------------------------------------------
// Convite / reivindicação de conta do atleta (Portal do Jogador)
// ---------------------------------------------------------------------------

/** Resposta ao gerar um convite (código em claro exibido só uma vez). */
export const InviteResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});
export type InviteResponse = z.infer<typeof InviteResponseSchema>;

/** Reivindicar a conta de atleta com o código do convite + credenciais. */
export const ClaimRequestSchema = z.object({
  code: z.string().min(1, 'Informe o código do convite'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});
export type ClaimRequest = z.infer<typeof ClaimRequestSchema>;

// ---------------------------------------------------------------------------
// Dados escopados ao próprio atleta (/me/*)
// ---------------------------------------------------------------------------

/** Um jogo do atleta, já com o ponto de vista dele (minha dupla × adversária). */
export const PlayerMatchSchema = z.object({
  id: z.string(),
  championshipName: z.string(),
  roundLabel: z.string(),
  groupName: z.string(),
  mine: MatchTeamRefSchema,
  opponent: MatchTeamRefSchema,
  sets: z.array(SetScoreSchema).nullable(),
  status: MatchStatusSchema,
  didIWin: z.boolean().nullable(),
  venueName: z.string().nullable(),
  scheduledAt: z.string().nullable(),
});
export type PlayerMatch = z.infer<typeof PlayerMatchSchema>;

/** Posição do atleta no ranking do campeonato ativo (para a Home). */
export const MeRankingSchema = z.object({
  championshipId: z.string().nullable(),
  championshipName: z.string().nullable(),
  position: z.number().int().nullable(),
  total: z.number().int(),
  points: z.number(),
  wins: z.number().int(),
  losses: z.number().int(),
  // Variação de posição vs. a rodada anterior: >0 subiu, <0 caiu, 0 estável, null s/ base.
  delta: z.number().int().nullable(),
});
export type MeRanking = z.infer<typeof MeRankingSchema>;
