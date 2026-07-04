import { z } from 'zod';
import { SkillLevelSchema, PlayerStatusSchema } from './player';

// ---------------------------------------------------------------------------
// Enums e rótulos (pt-BR)
// ---------------------------------------------------------------------------

/** Ciclo de vida da rodada. Sprint 4 opera SCHEDULED/OPEN; DRAWN+ entram com o sorteio (Sprint 5). */
export const RoundStatusSchema = z.enum([
  'SCHEDULED',
  'OPEN',
  'DRAWN',
  'IN_PROGRESS',
  'FINISHED',
]);
export type RoundStatus = z.infer<typeof RoundStatusSchema>;

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  SCHEDULED: 'Agendada',
  OPEN: 'Inscrições abertas',
  DRAWN: 'Sorteada',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Encerrada',
};

export const RoundKindSchema = z.enum(['REGULAR', 'FINAL_PHASE']);
export type RoundKind = z.infer<typeof RoundKindSchema>;

export const ROUND_KIND_LABELS: Record<RoundKind, string> = {
  REGULAR: 'Regular',
  FINAL_PHASE: 'Fase final',
};

/** Situação da inscrição (BR-09). */
export const RegistrationStatusSchema = z.enum([
  'CONFIRMED',
  'PENDING',
  'ABSENT',
  'WAITLIST',
]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendente',
  ABSENT: 'Ausente',
  WAITLIST: 'Lista de espera',
};

// ---------------------------------------------------------------------------
// Formato de partida (BR-26) — default 1 set
// ---------------------------------------------------------------------------

export const MatchFormatSchema = z.object({
  sets: z.union([z.literal(1), z.literal(3)]).default(1),
  gamesPerSet: z.number().int().min(1).max(9).default(6),
  tieBreakAt: z.number().int().min(1).max(9).default(6),
  matchTieBreak: z.boolean().default(false),
  /** Placar (games) atribuído ao vencedor num W.O. — padrão 6/0 (BR-27). */
  walkoverGames: z.number().int().min(1).max(9).default(6),
});
export type MatchFormat = z.infer<typeof MatchFormatSchema>;

export const DEFAULT_MATCH_FORMAT: MatchFormat = {
  sets: 1,
  gamesPerSet: 6,
  tieBreakAt: 6,
  matchTieBreak: false,
  walkoverGames: 6,
};

// ---------------------------------------------------------------------------
// Limites e defaults de inscrição/rodada
// ---------------------------------------------------------------------------

/** Mínimo/máximo de confirmados por rodada (BR-07). */
export const REGISTRATION_MIN = 8;
export const REGISTRATION_MAX = 64;

/** Tamanho de grupo preferencial (BR-23 / FORMATS.md). */
export const GROUP_SIZE_MIN = 3;
export const GROUP_SIZE_MAX = 4;

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

// ---------------------------------------------------------------------------
// Schemas de entrada — Rodada
// ---------------------------------------------------------------------------

export const CreateRoundSchema = z.object({
  /** Opcional: se omitido, a API numera automaticamente (próximo sequencial). */
  number: z.coerce.number().int().min(1).max(999).optional(),
  date: dateOnly.optional().or(z.literal('')),
  kind: RoundKindSchema.default('REGULAR'),
  groupSizePref: z.coerce.number().int().min(GROUP_SIZE_MIN).max(GROUP_SIZE_MAX).default(3),
  matchFormat: MatchFormatSchema.partial().optional(),
});
export type CreateRound = z.infer<typeof CreateRoundSchema>;

export const UpdateRoundSchema = z
  .object({
    number: z.coerce.number().int().min(1).max(999),
    date: dateOnly.or(z.literal('')),
    groupSizePref: z.coerce.number().int().min(GROUP_SIZE_MIN).max(GROUP_SIZE_MAX),
    matchFormat: MatchFormatSchema.partial(),
  })
  .partial();
export type UpdateRound = z.infer<typeof UpdateRoundSchema>;

export const UpdateRoundStatusSchema = z.object({ status: RoundStatusSchema });
export type UpdateRoundStatus = z.infer<typeof UpdateRoundStatusSchema>;

// ---------------------------------------------------------------------------
// Schemas de entrada — Inscrição
// ---------------------------------------------------------------------------

export const CreateRegistrationSchema = z.object({
  playerId: z.string().uuid(),
  status: RegistrationStatusSchema.default('CONFIRMED'),
});
export type CreateRegistration = z.infer<typeof CreateRegistrationSchema>;

export const UpdateRegistrationSchema = z
  .object({
    status: RegistrationStatusSchema,
    /** Jogador que assume a vaga (substituição por lesão/desistência) — BR-10/BR-27. */
    substitutedById: z.string().uuid().nullable(),
  })
  .partial();
export type UpdateRegistration = z.infer<typeof UpdateRegistrationSchema>;

// ---------------------------------------------------------------------------
// Schemas de resposta
// ---------------------------------------------------------------------------

/** Resumo do jogador embutido na inscrição (evita buscar /players separadamente). */
export const RegistrationPlayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  skillLevel: SkillLevelSchema,
  status: PlayerStatusSchema,
});
export type RegistrationPlayer = z.infer<typeof RegistrationPlayerSchema>;

export const RegistrationSchema = z.object({
  id: z.string().uuid(),
  roundId: z.string().uuid(),
  status: RegistrationStatusSchema,
  substitutedById: z.string().uuid().nullable(),
  player: RegistrationPlayerSchema,
  createdAt: z.string(),
});
export type Registration = z.infer<typeof RegistrationSchema>;

/** Contagem de inscrições por status. */
export const RegistrationSummarySchema = z.object({
  confirmed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  absent: z.number().int().nonnegative(),
  waitlist: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type RegistrationSummary = z.infer<typeof RegistrationSummarySchema>;

/** Prontidão da rodada para o sorteio (BR-07/08/11). O gate real do sorteio (Sprint 5) reusa isto. */
export const RoundReadinessSchema = z.object({
  confirmedCount: z.number().int().nonnegative(),
  isEven: z.boolean(),
  inRange: z.boolean(),
  canDraw: z.boolean(),
  code: z.enum(['ODD_PLAYER_COUNT', 'PLAYER_COUNT_OUT_OF_RANGE']).optional(),
  message: z.string().optional(),
});
export type RoundReadiness = z.infer<typeof RoundReadinessSchema>;

export const RoundSchema = z.object({
  id: z.string().uuid(),
  championshipId: z.string().uuid(),
  championshipName: z.string(),
  number: z.number().int(),
  date: z.string().nullable(),
  status: RoundStatusSchema,
  kind: RoundKindSchema,
  matchFormat: MatchFormatSchema,
  groupSizePref: z.number().int(),
  createdAt: z.string(),
  summary: RegistrationSummarySchema,
  readiness: RoundReadinessSchema,
  /** Presente no detalhe (GET /rounds/:id); ausente na listagem. */
  registrations: z.array(RegistrationSchema).optional(),
});
export type Round = z.infer<typeof RoundSchema>;

/**
 * Rótulo de exibição da rodada: "Rodada N" para regulares; "Fase Final — {campeonato}"
 * para a fase final (BR-34), diferenciando-a das rodadas normais.
 */
export function roundLabel(input: {
  kind: RoundKind;
  number: number;
  championshipName?: string | null;
}): string {
  if (input.kind === 'FINAL_PHASE') {
    return input.championshipName ? `Fase Final — ${input.championshipName}` : 'Fase Final';
  }
  return `Rodada ${input.number}`;
}

// ---------------------------------------------------------------------------
// Helpers puros (testáveis) — regras de contagem e formato
// ---------------------------------------------------------------------------

/**
 * Avalia se a rodada pode ir a sorteio a partir do nº de confirmados (BR-07/08/11).
 * Prioridade da falha: faixa [8,64] antes de paridade.
 */
export function computeRoundReadiness(confirmedCount: number): RoundReadiness {
  const isEven = confirmedCount % 2 === 0;
  const inRange = confirmedCount >= REGISTRATION_MIN && confirmedCount <= REGISTRATION_MAX;

  if (!inRange) {
    return {
      confirmedCount,
      isEven,
      inRange,
      canDraw: false,
      code: 'PLAYER_COUNT_OUT_OF_RANGE',
      message: `São necessários entre ${REGISTRATION_MIN} e ${REGISTRATION_MAX} confirmados (atual: ${confirmedCount}).`,
    };
  }
  if (!isEven) {
    return {
      confirmedCount,
      isEven,
      inRange,
      canDraw: false,
      code: 'ODD_PLAYER_COUNT',
      message: `O nº de confirmados deve ser par para formar duplas (atual: ${confirmedCount}).`,
    };
  }
  return { confirmedCount, isEven, inRange, canDraw: true };
}

/** Rótulo da chave de mata-mata por tamanho (potência de 2). */
export const BRACKET_LABELS: Record<number, string> = {
  2: 'Final',
  4: 'Semifinal',
  8: 'Quartas de final',
  16: 'Oitavas de final',
  32: 'Dezesseis avos',
};

export const RoundFormatSchema = z.object({
  teams: z.number().int().nonnegative(),
  groups: z.array(z.number().int()),
  groupCount: z.number().int().nonnegative(),
  bracketSize: z.number().int().nonnegative(),
  bracketLabel: z.string(),
  groupWinners: z.number().int().nonnegative(),
  bestRunnersUp: z.number().int().nonnegative(),
  qualifiers: z.number().int().nonnegative(),
  qualificationRule: z.string(),
});
export type RoundFormat = z.infer<typeof RoundFormatSchema>;

/** Menor potência de 2 maior ou igual a n. */
function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Particiona D duplas em grupos, preferindo `pref` (3 por padrão) e absorvendo sobras
 * com o outro tamanho (BR-23 / FORMATS.md). Caso especial: D==5 → um único grupo de 5.
 * Retorna os tamanhos em ordem crescente (ex.: [3,3,4]).
 */
export function partitionGroups(teams: number, pref = 3): number[] {
  if (teams <= 0) return [];
  if (teams < 6) {
    // 4 ou 5 duplas → grupo único (Final direta). D<4 não ocorre em rodada válida.
    return [teams];
  }
  const big = pref === 4 ? 4 : 3;
  const small = big === 4 ? 3 : 4; // tamanho usado para absorver a sobra
  for (let y = 0; y <= Math.floor(teams / small); y++) {
    const rem = teams - small * y;
    if (rem >= 0 && rem % big === 0) {
      const groups = [...Array(rem / big).fill(big), ...Array(y).fill(small)];
      return groups.sort((a, b) => a - b);
    }
  }
  return [teams];
}

/**
 * Deriva o formato da rodada (grupos + chave + classificação) a partir do nº de duplas.
 * Espelha a matriz determinística de FORMATS.md. Somente leitura/prévia — o sorteio (Sprint 5)
 * é quem forma as duplas e os grupos de fato.
 */
export function describeRoundFormat(teams: number, groupSizePref = 3): RoundFormat {
  const groups = partitionGroups(teams, groupSizePref);
  const groupCount = groups.length;

  if (groupCount <= 1) {
    // G=1 (8/10 jogadores): os 2 primeiros do grupo fazem a Final (BR-23b).
    return {
      teams,
      groups,
      groupCount,
      bracketSize: 2,
      bracketLabel: BRACKET_LABELS[2] ?? 'Final',
      groupWinners: teams >= 2 ? 2 : teams,
      bestRunnersUp: 0,
      qualifiers: Math.min(2, teams),
      qualificationRule: 'Os 2 primeiros do grupo fazem a Final.',
    };
  }

  if (groupCount === 2) {
    // G=2 (12/14/16): top-2 de cada grupo → Semifinal de 4 (BR-23b).
    return {
      teams,
      groups,
      groupCount,
      bracketSize: 4,
      bracketLabel: BRACKET_LABELS[4] ?? 'Semifinal',
      groupWinners: 4,
      bestRunnersUp: 0,
      qualifiers: 4,
      qualificationRule: 'Top-2 de cada grupo (Semifinal: 1ºA×2ºB e 1ºB×2ºA).',
    };
  }

  // G>=3: vencedores de grupo + melhores 2ºs até fechar a chave de potência de 2 (BR-23a).
  const bracketSize = nextPowerOfTwo(groupCount);
  const bestRunnersUp = bracketSize - groupCount;
  const runnersLabel =
    bestRunnersUp === 0
      ? `${groupCount} vencedores de grupo`
      : `${groupCount} vencedores + ${bestRunnersUp} melhor${bestRunnersUp > 1 ? 'es' : ''} 2º${bestRunnersUp > 1 ? 's' : ''} colocado${bestRunnersUp > 1 ? 's' : ''}`;

  return {
    teams,
    groups,
    groupCount,
    bracketSize,
    bracketLabel: BRACKET_LABELS[bracketSize] ?? `Chave de ${bracketSize}`,
    groupWinners: groupCount,
    bestRunnersUp,
    qualifiers: bracketSize,
    qualificationRule: `Classificam-se ${runnersLabel} até completar a ${BRACKET_LABELS[bracketSize] ?? `chave de ${bracketSize}`}.`,
  };
}
