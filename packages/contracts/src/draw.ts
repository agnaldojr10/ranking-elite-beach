import { z } from 'zod';
import { DrawWeightsSchema } from './championship';
import { SkillLevelSchema, type SkillLevel } from './player';
import { RoundFormatSchema } from './round';

// ---------------------------------------------------------------------------
// Força do jogador derivada do nível técnico (proxy de ranking até a Sprint 7).
// ---------------------------------------------------------------------------
export const SKILL_STRENGTH: Record<SkillLevel, number> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  PRO: 100,
};

/** Chave de par não-ordenada (a<b) para históricos de parceiros/adversários. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ---------------------------------------------------------------------------
// Config do sorteio
// ---------------------------------------------------------------------------
export const DrawConfigSchema = z.object({
  weights: DrawWeightsSchema,
  randomness: z.number().int().min(0).max(100),
  allowRepeatPartners: z.boolean(),
  allowRepeatOpponents: z.boolean(),
  groupSizePreference: z.number().int().min(3).max(4),
});
export type DrawConfig = z.infer<typeof DrawConfigSchema>;

/** Overrides opcionais + seed enviados no request de simulação. */
export const SimulateDrawSchema = z.object({
  weights: DrawWeightsSchema.partial().optional(),
  randomness: z.coerce.number().int().min(0).max(100).optional(),
  allowRepeatPartners: z.boolean().optional(),
  allowRepeatOpponents: z.boolean().optional(),
  groupSizePreference: z.coerce.number().int().min(3).max(4).optional(),
  seed: z.string().trim().min(1).max(64).optional(),
});
export type SimulateDraw = z.infer<typeof SimulateDrawSchema>;

/** Confirmação: mesmos overrides do simulate, mas a `seed` é obrigatória (grava o que foi visto). */
export const ConfirmDrawSchema = SimulateDrawSchema.extend({
  seed: z.string().trim().min(1).max(64),
});
export type ConfirmDraw = z.infer<typeof ConfirmDrawSchema>;

// ---------------------------------------------------------------------------
// Entrada do motor
// ---------------------------------------------------------------------------
export const DrawPlayerInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.number().min(0).max(100),
  skillLevel: SkillLevelSchema,
});
export type DrawPlayerInput = z.infer<typeof DrawPlayerInputSchema>;

/**
 * Entrada completa do `runDraw`. Os históricos são mapas (pairKey → contagem);
 * podem vir vazios (rodada sem histórico persistido ainda).
 */
export type DrawInput = {
  players: DrawPlayerInput[];
  partnerHistory: Map<string, number>;
  opponentHistory: Map<string, number>;
  config: DrawConfig;
  seed: string;
};

// ---------------------------------------------------------------------------
// Saída do motor
// ---------------------------------------------------------------------------
export const DrawTeamSchema = z.object({
  id: z.string(),
  label: z.string(),
  players: z.tuple([z.string(), z.string()]),
  playerNames: z.tuple([z.string(), z.string()]),
  strength: z.number(),
});
export type DrawTeam = z.infer<typeof DrawTeamSchema>;

export const DrawGroupSchema = z.object({
  name: z.string(),
  teamIds: z.array(z.string()),
});
export type DrawGroup = z.infer<typeof DrawGroupSchema>;

export const DrawMatchSchema = z.object({
  groupName: z.string(),
  teamAId: z.string(),
  teamBId: z.string(),
});
export type DrawMatch = z.infer<typeof DrawMatchSchema>;

/** Métricas de qualidade reportadas pelo sorteio (BR-21). */
export const DrawMetricsSchema = z.object({
  repeatedPartners: z.number().int().nonnegative(),
  repeatedOpponents: z.number().int().nonnegative(),
  groupBalance: z.number(),
  avgRankingDiff: z.number(),
  partnerDiversity: z.number(),
});
export type DrawMetrics = z.infer<typeof DrawMetricsSchema>;

export const DrawResultSchema = z.object({
  seed: z.string(),
  teams: z.array(DrawTeamSchema),
  groups: z.array(DrawGroupSchema),
  matches: z.array(DrawMatchSchema),
  qualityScore: z.number().min(0).max(100),
  metrics: DrawMetricsSchema,
  explanations: z.array(z.string()),
  format: RoundFormatSchema,
});
export type DrawResult = z.infer<typeof DrawResultSchema>;

// ---------------------------------------------------------------------------
// Sorteio confirmado (persistido) — resposta do GET /rounds/:id/draw
// ---------------------------------------------------------------------------
export const MatchStatusSchema = z.enum(['PENDING', 'PLAYED', 'WALKOVER']);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  PENDING: 'A jogar',
  PLAYED: 'Jogado',
  WALKOVER: 'W.O.',
};

export const ConfirmedMatchSchema = DrawMatchSchema.extend({
  id: z.string(),
  status: MatchStatusSchema,
});
export type ConfirmedMatch = z.infer<typeof ConfirmedMatchSchema>;

export const ConfirmedDrawSchema = z.object({
  id: z.string(),
  roundId: z.string(),
  seed: z.string(),
  qualityScore: z.number(),
  metrics: DrawMetricsSchema,
  explanations: z.array(z.string()),
  teams: z.array(DrawTeamSchema),
  groups: z.array(DrawGroupSchema),
  matches: z.array(ConfirmedMatchSchema),
  createdAt: z.string(),
});
export type ConfirmedDraw = z.infer<typeof ConfirmedDrawSchema>;
