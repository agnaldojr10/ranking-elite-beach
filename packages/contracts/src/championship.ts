import { z } from 'zod';

export const ChampionshipStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'FINISHED']);
export type ChampionshipStatus = z.infer<typeof ChampionshipStatusSchema>;

export const CHAMPIONSHIP_STATUS_LABELS: Record<ChampionshipStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  FINISHED: 'Encerrado',
};

/** Critérios de desempate (BR-29). */
export const TiebreakerSchema = z.enum([
  'POINTS',
  'SET_BALANCE',
  'GAME_BALANCE',
  'HEAD_TO_HEAD',
  'DRAW',
]);
export type Tiebreaker = z.infer<typeof TiebreakerSchema>;

export const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  POINTS: 'Pontos',
  SET_BALANCE: 'Saldo de sets',
  GAME_BALANCE: 'Saldo de games',
  HEAD_TO_HEAD: 'Confronto direto',
  DRAW: 'Sorteio',
};

/** Tabela de pontuação por colocação: { "1": 100, "2": 80, ... }. */
export const ScoringTableSchema = z.record(
  z.string().regex(/^\d+$/, 'A chave deve ser a colocação (número)'),
  z.number().int().nonnegative(),
);
export type ScoringTable = z.infer<typeof ScoringTableSchema>;

export const DrawWeightsSchema = z.object({
  ranking: z.number().min(0).max(1),
  skill: z.number().min(0).max(1),
  partner: z.number().min(0).max(1),
  opponent: z.number().min(0).max(1),
});
export type DrawWeights = z.infer<typeof DrawWeightsSchema>;

export const FinalConfigSchema = z.object({
  groupSizePreference: z.number().int().min(3).max(5).default(3),
  format: z.literal('GROUPS_KNOCKOUT').default('GROUPS_KNOCKOUT'),
});
export type FinalConfig = z.infer<typeof FinalConfigSchema>;

export const ChampionshipConfigSchema = z.object({
  scoringTable: ScoringTableSchema,
  tiebreakers: z.array(TiebreakerSchema).min(1),
  drawWeights: DrawWeightsSchema,
  randomness: z.number().int().min(0).max(100),
  allowRepeatPartners: z.boolean(),
  allowRepeatOpponents: z.boolean(),
  finalConfig: FinalConfigSchema,
});
export type ChampionshipConfig = z.infer<typeof ChampionshipConfigSchema>;

/** Campos estruturais: imutáveis quando o campeonato não está em DRAFT (BR-05). */
export const STRUCTURAL_CONFIG_KEYS = ['scoringTable', 'tiebreakers', 'finalConfig'] as const;

// ---- Defaults (nunca hardcode em telas/serviços; use estes) ----
export const DEFAULT_SCORING_TABLE: ScoringTable = {
  '1': 100,
  '2': 80,
  '3': 65,
  '4': 50,
  '5': 40,
  '6': 30,
  '7': 20,
  '8': 10,
};

export const DEFAULT_TIEBREAKERS: Tiebreaker[] = [
  'POINTS',
  'GAME_BALANCE',
  'HEAD_TO_HEAD',
  'DRAW',
];

export const DEFAULT_DRAW_WEIGHTS: DrawWeights = {
  ranking: 0.35,
  skill: 0.15,
  partner: 0.35,
  opponent: 0.15,
};

export const DEFAULT_FINAL_CONFIG: FinalConfig = {
  groupSizePreference: 3,
  format: 'GROUPS_KNOCKOUT',
};

export const DEFAULT_CHAMPIONSHIP_CONFIG: ChampionshipConfig = {
  scoringTable: DEFAULT_SCORING_TABLE,
  tiebreakers: DEFAULT_TIEBREAKERS,
  drawWeights: DEFAULT_DRAW_WEIGHTS,
  randomness: 50,
  allowRepeatPartners: false,
  allowRepeatOpponents: true,
  finalConfig: DEFAULT_FINAL_CONFIG,
};

export const CreateChampionshipSchema = z.object({
  seasonId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  roundsCount: z.coerce.number().int().min(1).max(52),
  qualifiersCount: z.coerce.number().int().min(2).max(64),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  config: ChampionshipConfigSchema.partial().optional(),
});
export type CreateChampionship = z.infer<typeof CreateChampionshipSchema>;

export const UpdateChampionshipConfigSchema = ChampionshipConfigSchema.partial();
export type UpdateChampionshipConfig = z.infer<typeof UpdateChampionshipConfigSchema>;

/** Edição dos dados básicos do campeonato. roundsCount/qualifiersCount só em DRAFT. */
export const UpdateChampionshipSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    roundsCount: z.coerce.number().int().min(1).max(52),
    qualifiersCount: z.coerce.number().int().min(2).max(64),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.literal('')),
  })
  .partial();
export type UpdateChampionship = z.infer<typeof UpdateChampionshipSchema>;

export const UpdateChampionshipStatusSchema = z.object({ status: ChampionshipStatusSchema });
export type UpdateChampionshipStatus = z.infer<typeof UpdateChampionshipStatusSchema>;

export const ChampionshipSchema = z.object({
  id: z.string().uuid(),
  seasonId: z.string().uuid(),
  name: z.string(),
  roundsCount: z.number().int(),
  qualifiersCount: z.number().int(),
  status: ChampionshipStatusSchema,
  startDate: z.string().nullable(),
  createdAt: z.string(),
  config: ChampionshipConfigSchema,
});
export type Championship = z.infer<typeof ChampionshipSchema>;
