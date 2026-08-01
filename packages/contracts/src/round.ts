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

/** Inscrição em lote (vários jogadores de uma vez). */
export const BulkCreateRegistrationSchema = z.object({
  playerIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos 1 jogador').max(64),
  status: RegistrationStatusSchema.default('CONFIRMED'),
});
export type BulkCreateRegistration = z.infer<typeof BulkCreateRegistrationSchema>;

export const UpdateRegistrationSchema = z
  .object({
    status: RegistrationStatusSchema,
    /** Jogador que assume a vaga (substituição por lesão/desistência) — BR-10/BR-27. */
    substitutedById: z.string().uuid().nullable(),
  })
  .partial();
export type UpdateRegistration = z.infer<typeof UpdateRegistrationSchema>;

// ---------------------------------------------------------------------------
// Lançamento por classificação (fallback sem sorteio/placares)
// ---------------------------------------------------------------------------

/**
 * Lança uma rodada informando só a CLASSIFICAÇÃO: os participantes (18 + espera)
 * e as duplas do pódio na ordem (campeão, vice, 3º, 4º). Os demais participantes
 * recebem participação. Usado quando não há placares (ex.: rodada já jogada fora do app).
 */
export const RecordClassificationSchema = z
  .object({
    participantIds: z.array(z.string().uuid()).min(2, 'Marque ao menos 2 participantes'),
    waitlistIds: z.array(z.string().uuid()).default([]),
    podium: z
      .array(z.object({ playerIds: z.tuple([z.string().uuid(), z.string().uuid()]) }))
      .max(4, 'No máximo 4 duplas no pódio (campeão, vice, 3º, 4º)')
      .default([]),
  })
  .superRefine((v, ctx) => {
    const podiumIds = v.podium.flatMap((p) => p.playerIds);
    const seen = new Set<string>();
    for (const id of [...v.participantIds, ...v.waitlistIds]) {
      if (seen.has(id)) ctx.addIssue({ code: 'custom', message: 'Jogador repetido na lista' });
      seen.add(id);
    }
    const pods = new Set<string>();
    for (const id of podiumIds) {
      if (pods.has(id)) ctx.addIssue({ code: 'custom', message: 'Jogador repetido no pódio' });
      pods.add(id);
      if (!v.participantIds.includes(id))
        ctx.addIssue({ code: 'custom', message: 'Jogador do pódio deve estar entre os participantes' });
    }
  });
export type RecordClassification = z.infer<typeof RecordClassificationSchema>;

/** Uma dupla resultante do lançamento, com sua colocação (1 = campeão). */
export type ClassificationTeam = { playerIds: string[]; position: number };

/**
 * Monta as duplas a partir do pódio + participantes. Pódio nas posições 1..k
 * (na ordem informada); os demais participantes são pareados na sequência
 * (sobra ímpar vira dupla de 1) nas posições seguintes. Função pura/testável.
 */
export function buildClassificationTeams(
  participantIds: string[],
  podium: { playerIds: [string, string] }[],
): ClassificationTeam[] {
  const teams: ClassificationTeam[] = [];
  const used = new Set<string>();
  podium.forEach((p, i) => {
    teams.push({ playerIds: [...p.playerIds], position: i + 1 });
    p.playerIds.forEach((id) => used.add(id));
  });
  const rest = participantIds.filter((id) => !used.has(id));
  let position = podium.length + 1;
  for (let i = 0; i < rest.length; i += 2) {
    const pair = rest.slice(i, i + 2);
    teams.push({ playerIds: pair, position });
    position += 1;
  }
  return teams;
}

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
 * Deriva o formato da rodada (grupos + classificação) a partir do nº de duplas.
 * Classificação flexível e automática (Fase 14), espelhando `planKnockout`:
 *   • ≥6 duplas → 6 classificados: as 2 melhores vão direto à semifinal (bye) e
 *     a 3ª–6ª disputam as quartas (2 vagas); depois Final + disputa de 3º.
 *   • 4–5 duplas → 4 classificados: semifinal direta (1×4, 2×3) → Final + 3º.
 *   • 2–3 duplas → 2 classificados: Final direta.
 * O ranqueamento dos classificados é GLOBAL (vitórias → saldo), não por grupo.
 * Somente leitura/prévia — o sorteio é quem forma as duplas e os grupos de fato.
 */
export function describeRoundFormat(teams: number, groupSizePref = 3): RoundFormat {
  const groups = partitionGroups(teams, groupSizePref);
  const groupCount = groups.length;

  // 2 grupos (ex.: 16 jog. = 2×4): 2 primeiros de cada grupo → semifinal cruzada.
  if (teams >= 6 && groupCount === 2) {
    return {
      teams,
      groups,
      groupCount,
      bracketSize: 4,
      bracketLabel: BRACKET_LABELS[4] ?? 'Semifinal',
      groupWinners: 4,
      bestRunnersUp: 0,
      qualifiers: 4,
      qualificationRule:
        'Classificam-se os 2 primeiros de cada grupo (4 duplas). Semifinal cruzada (1ºA×2ºB, 1ºB×2ºA) → Final + disputa de 3º.',
    };
  }

  if (teams >= 6) {
    return {
      teams,
      groups,
      groupCount,
      bracketSize: 6,
      bracketLabel: BRACKET_LABELS[8] ?? 'Quartas de final',
      groupWinners: groupCount,
      bestRunnersUp: Math.max(0, 6 - groupCount),
      qualifiers: 6,
      qualificationRule:
        'As 6 melhores duplas (ranking geral por vitórias e saldo) avançam: a 1ª e a 2ª vão direto à semifinal; a 3ª à 6ª disputam as quartas por 2 vagas (evitando revanche de grupo). Depois Final + disputa de 3º.',
    };
  }

  if (teams >= 4) {
    return {
      teams,
      groups,
      groupCount,
      bracketSize: 4,
      bracketLabel: BRACKET_LABELS[4] ?? 'Semifinal',
      groupWinners: Math.min(4, teams),
      bestRunnersUp: 0,
      qualifiers: 4,
      qualificationRule:
        'As 4 melhores duplas (ranking geral) fazem a semifinal (1×4, 2×3). Depois Final + disputa de 3º.',
    };
  }

  return {
    teams,
    groups,
    groupCount,
    bracketSize: 2,
    bracketLabel: BRACKET_LABELS[2] ?? 'Final',
    groupWinners: Math.min(2, teams),
    bestRunnersUp: 0,
    qualifiers: Math.min(2, teams),
    qualificationRule: 'As 2 melhores duplas fazem a Final.',
  };
}

// ---------------------------------------------------------------------------
// Relatório da rodada (texto para compartilhar no WhatsApp)
// ---------------------------------------------------------------------------

export const RoundReportSchema = z.object({ text: z.string() });
export type RoundReport = z.infer<typeof RoundReportSchema>;

export type RoundReportResult = {
  playerNames: [string, string];
  finalPosition: number;
  pointsAwarded: number;
};
export type RoundReportRankingRow = { playerName: string; points: number };

/** Converte AAAA-MM-DD (ou ISO) em DD/MM/AAAA; devolve como veio se não casar. */
function formatReportDate(date: string | null): string | null {
  if (!date) return null;
  const m = date.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const pair = (names: [string, string]) => names.filter(Boolean).join(' & ');

/**
 * Monta o texto do relatório da rodada (colocação + ranking atualizado) para
 * envio manual no WhatsApp. Função pura/testável — a API só junta os dados.
 */
export function buildRoundReport(input: {
  championshipName: string;
  roundLabel: string;
  date: string | null;
  results: RoundReportResult[];
  ranking: RoundReportRankingRow[];
  rankingLimit?: number;
}): string {
  const date = formatReportDate(input.date);
  const lines: string[] = [];

  lines.push(`🏖️ ${input.championshipName}`);
  lines.push(`🎾 ${input.roundLabel}${date ? ` — ${date}` : ''}`);

  const results = [...input.results].sort((a, b) => a.finalPosition - b.finalPosition);
  if (results.length > 0) {
    lines.push('', '🏆 Resultado da rodada');
    for (const r of results) {
      const badge = MEDALS[r.finalPosition - 1] ?? `${r.finalPosition}º`;
      lines.push(`${badge} ${pair(r.playerNames)} — ${r.pointsAwarded} pts`);
    }
  } else {
    lines.push('', '_Rodada ainda em andamento (sem resultado final)._');
  }

  const limit = input.rankingLimit ?? 10;
  const top = input.ranking.slice(0, limit);
  if (top.length > 0) {
    lines.push('', '📊 Ranking do campeonato');
    top.forEach((row, i) => {
      lines.push(`${i + 1}. ${row.playerName} — ${row.points} pts`);
    });
    if (input.ranking.length > limit) {
      lines.push(`… e mais ${input.ranking.length - limit}.`);
    }
  }

  lines.push('', 'Ranking Elite Beach 🏝️');
  return lines.join('\n');
}

/**
 * Monta o texto do SORTEIO da rodada (grupos + duplas) para enviar no WhatsApp
 * logo após sortear. Função pura/testável.
 */
export function buildDrawReport(input: {
  championshipName: string;
  roundLabel: string;
  date: string | null;
  groups: { name: string; pairs: [string, string][] }[];
}): string {
  const date = formatReportDate(input.date);
  const lines: string[] = [];
  lines.push(`🏖️ ${input.championshipName}`);
  lines.push(`🎾 ${input.roundLabel}${date ? ` — ${date}` : ''} · Sorteio das duplas`);

  for (const g of input.groups) {
    lines.push('', `📋 Grupo ${g.name}`);
    for (const p of g.pairs) lines.push(`• ${p.filter(Boolean).join(' & ')}`);
  }
  if (input.groups.length === 0) {
    lines.push('', '_Sorteio ainda não confirmado._');
  }

  lines.push('', 'Bora pro jogo! 🎾🏝️');
  return lines.join('\n');
}
