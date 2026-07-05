import { z } from 'zod';
import { ChampionshipStatusSchema } from './championship';
import { MatchStatusSchema } from './draw';
import { KnockoutMatchViewSchema } from './knockout';
import { GroupStandingsSchema, MatchTeamRefSchema, SetScoreSchema } from './match';
import { RoundKindSchema, RoundStatusSchema } from './round';

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

// ---------------------------------------------------------------------------
// Meus Torneios
// ---------------------------------------------------------------------------

/** Resumo de um campeonato que o atleta participa (lista). */
export const MeTournamentSummarySchema = z.object({
  championshipId: z.string(),
  name: z.string(),
  status: ChampionshipStatusSchema,
  position: z.number().int().nullable(),
  total: z.number().int(),
  points: z.number(),
  roundsPlayed: z.number().int(),
  bestPlacement: z.number().int().nullable(),
  isChampion: z.boolean(),
});
export type MeTournamentSummary = z.infer<typeof MeTournamentSummarySchema>;

/** Uma rodada do campeonato, do ponto de vista do atleta. */
export const MeTournamentRoundSchema = z.object({
  roundId: z.string(),
  label: z.string(),
  kind: RoundKindSchema,
  status: RoundStatusSchema,
  myTeamId: z.string(),
  myGroup: GroupStandingsSchema.nullable(),
  myKnockout: z.array(KnockoutMatchViewSchema),
  myResult: z
    .object({ finalPosition: z.number().int(), pointsAwarded: z.number().int() })
    .nullable(),
});
export type MeTournamentRound = z.infer<typeof MeTournamentRoundSchema>;

/** Detalhe de um campeonato do atleta (minhas rodadas). */
export const MeTournamentDetailSchema = z.object({
  championshipId: z.string(),
  name: z.string(),
  status: ChampionshipStatusSchema,
  position: z.number().int().nullable(),
  total: z.number().int(),
  rounds: z.array(MeTournamentRoundSchema),
});
export type MeTournamentDetail = z.infer<typeof MeTournamentDetailSchema>;

// ---------------------------------------------------------------------------
// H2H (head-to-head)
// ---------------------------------------------------------------------------

/** Adversário já enfrentado (lista de rivais). */
export const MeOpponentSummarySchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  timesFaced: z.number().int(),
});
export type MeOpponentSummary = z.infer<typeof MeOpponentSummarySchema>;

/** Retrospecto direto contra um adversário. */
export const MeH2HSchema = z.object({
  opponent: z.object({ id: z.string(), name: z.string() }),
  wins: z.number().int(),
  losses: z.number().int(),
  total: z.number().int(),
  matches: z.array(PlayerMatchSchema),
});
export type MeH2H = z.infer<typeof MeH2HSchema>;

// ---------------------------------------------------------------------------
// Conquistas (gamificação)
// ---------------------------------------------------------------------------

export const AchievementTierSchema = z.enum(['bronze', 'silver', 'gold']);
export type AchievementTier = z.infer<typeof AchievementTierSchema>;

/** Medalha/conquista derivada dos números do atleta. */
export const MeAchievementSchema = z.object({
  code: z.string(),
  label: z.string(),
  description: z.string(),
  achieved: z.boolean(),
  value: z.number().nullable(),
  tier: AchievementTierSchema.nullable(),
});
export type MeAchievement = z.infer<typeof MeAchievementSchema>;
