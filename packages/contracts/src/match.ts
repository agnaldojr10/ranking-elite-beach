import { z } from 'zod';
import { MatchStatusSchema } from './draw';
import type { MatchFormat } from './round';

// ---------------------------------------------------------------------------
// Placar
// ---------------------------------------------------------------------------
export const SetScoreSchema = z.object({
  a: z.coerce.number().int().min(0).max(99),
  b: z.coerce.number().int().min(0).max(99),
});
export type SetScore = z.infer<typeof SetScoreSchema>;

export const WalkoverInputSchema = z.object({
  winnerTeamId: z.string().uuid(),
  injury: z.boolean().default(false),
});

/** Registrar resultado: OU um placar em sets, OU um W.O. (exatamente um). */
export const RegisterMatchResultSchema = z
  .object({
    sets: z.array(SetScoreSchema).min(1).max(3).optional(),
    walkover: WalkoverInputSchema.optional(),
  })
  .refine((v) => Boolean(v.sets) !== Boolean(v.walkover), {
    message: 'Informe o placar em sets OU um W.O., não ambos',
  });
export type RegisterMatchResult = z.infer<typeof RegisterMatchResultSchema>;

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------
export const MatchTeamRefSchema = z.object({
  id: z.string(),
  label: z.string(),
  playerNames: z.tuple([z.string(), z.string()]),
});
export type MatchTeamRef = z.infer<typeof MatchTeamRefSchema>;

export const MatchViewSchema = z.object({
  id: z.string(),
  groupName: z.string(),
  teamA: MatchTeamRefSchema,
  teamB: MatchTeamRefSchema,
  sets: z.array(SetScoreSchema).nullable(),
  winnerTeamId: z.string().nullable(),
  status: MatchStatusSchema,
  isWalkover: z.boolean(),
  walkoverInjury: z.boolean(),
  venueId: z.string().nullable(),
  venueName: z.string().nullable(),
  scheduledAt: z.string().nullable(),
});
export type MatchView = z.infer<typeof MatchViewSchema>;

export const StandingSchema = z.object({
  teamId: z.string(),
  label: z.string(),
  playerNames: z.tuple([z.string(), z.string()]),
  played: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
  gamesFor: z.number().int(),
  gamesAgainst: z.number().int(),
  gamesBalance: z.number().int(),
  position: z.number().int(),
});
export type Standing = z.infer<typeof StandingSchema>;

export const GroupStandingsSchema = z.object({
  groupName: z.string(),
  standings: z.array(StandingSchema),
});
export type GroupStandings = z.infer<typeof GroupStandingsSchema>;

// ---------------------------------------------------------------------------
// Helpers puros (testáveis)
// ---------------------------------------------------------------------------

export type MatchWinnerResult =
  | { valid: true; winnerTeamId: string }
  | { valid: false; reason: string };

/** Games necessários para vencer um set (aceita 6, 7-5, 7-6...). */
function isValidSet(s: SetScore, gamesPerSet: number): boolean {
  if (s.a === s.b) return false; // sem vencedor claro
  return Math.max(s.a, s.b) >= gamesPerSet;
}

/**
 * Deriva o vencedor de um jogo a partir do placar (BR-25). O vencedor nunca é
 * informado manualmente num jogo normal — ele sai dos sets.
 */
export function computeMatchWinner(
  sets: SetScore[],
  format: Pick<MatchFormat, 'sets' | 'gamesPerSet'>,
  teamAId: string,
  teamBId: string,
): MatchWinnerResult {
  const requiredWins = Math.floor(format.sets / 2) + 1; // 1 set → 1; melhor de 3 → 2
  const maxSets = format.sets;

  if (sets.length === 0 || sets.length > maxSets) {
    return { valid: false, reason: `Número de sets inválido para o formato (${format.sets}).` };
  }

  let winsA = 0;
  let winsB = 0;
  for (const s of sets) {
    if (!isValidSet(s, format.gamesPerSet)) {
      return { valid: false, reason: `Set ${s.a}×${s.b} não tem um vencedor válido.` };
    }
    if (s.a > s.b) winsA++;
    else winsB++;
  }

  if (winsA >= requiredWins && winsA > winsB) return { valid: true, winnerTeamId: teamAId };
  if (winsB >= requiredWins && winsB > winsA) return { valid: true, winnerTeamId: teamBId };
  return { valid: false, reason: 'O placar não define um vencedor (partida incompleta ou empatada).' };
}

export type StandingMatch = {
  teamAId: string;
  teamBId: string;
  sets: SetScore[] | null;
  winnerTeamId: string | null;
  status: z.infer<typeof MatchStatusSchema>;
};

export type StandingTeam = {
  teamId: string;
  label: string;
  playerNames: [string, string];
  seed: number;
};

/** Games de cada dupla num confronto (soma dos sets), na ordem (A, B). */
function gamesOf(m: StandingMatch): { a: number; b: number } {
  if (!m.sets) return { a: 0, b: 0 };
  return m.sets.reduce((acc, s) => ({ a: acc.a + s.a, b: acc.b + s.b }), { a: 0, b: 0 });
}

/**
 * Classificação de um grupo (BR-28/29): vitórias → saldo de games → confronto direto → seed.
 * W.O. conta como resultado normal. Jogos PENDING são ignorados.
 */
export function computeGroupStandings(
  matches: StandingMatch[],
  teams: StandingTeam[],
): Standing[] {
  const acc = new Map<
    string,
    { played: number; wins: number; losses: number; gamesFor: number; gamesAgainst: number }
  >();
  for (const t of teams) {
    acc.set(t.teamId, { played: 0, wins: 0, losses: 0, gamesFor: 0, gamesAgainst: 0 });
  }

  const played = matches.filter((m) => m.status !== 'PENDING' && m.winnerTeamId);
  for (const m of played) {
    const a = acc.get(m.teamAId);
    const b = acc.get(m.teamBId);
    if (!a || !b) continue;
    const g = gamesOf(m);
    a.played++;
    b.played++;
    a.gamesFor += g.a;
    a.gamesAgainst += g.b;
    b.gamesFor += g.b;
    b.gamesAgainst += g.a;
    if (m.winnerTeamId === m.teamAId) {
      a.wins++;
      b.losses++;
    } else {
      b.wins++;
      a.losses++;
    }
  }

  // Confronto direto entre dois times (quem venceu o jogo entre eles).
  const headToHead = (x: string, y: string): number => {
    const m = played.find(
      (p) =>
        (p.teamAId === x && p.teamBId === y) || (p.teamAId === y && p.teamBId === x),
    );
    if (!m || !m.winnerTeamId) return 0;
    return m.winnerTeamId === x ? -1 : 1; // -1 = x na frente
  };

  const seedOf = new Map(teams.map((t) => [t.teamId, t.seed]));

  const sorted = [...teams].sort((ta, tb) => {
    const a = acc.get(ta.teamId)!;
    const b = acc.get(tb.teamId)!;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const balA = a.gamesFor - a.gamesAgainst;
    const balB = b.gamesFor - b.gamesAgainst;
    if (balB !== balA) return balB - balA;
    const h2h = headToHead(ta.teamId, tb.teamId);
    if (h2h !== 0) return h2h;
    return (seedOf.get(ta.teamId) ?? 0) - (seedOf.get(tb.teamId) ?? 0);
  });

  return sorted.map((t, i) => {
    const s = acc.get(t.teamId)!;
    return {
      teamId: t.teamId,
      label: t.label,
      playerNames: t.playerNames,
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      gamesFor: s.gamesFor,
      gamesAgainst: s.gamesAgainst,
      gamesBalance: s.gamesFor - s.gamesAgainst,
      position: i + 1,
    };
  });
}
