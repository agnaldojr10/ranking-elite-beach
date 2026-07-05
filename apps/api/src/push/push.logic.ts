/** Jogo candidato ao lembrete "vai começar" (campos mínimos). */
export type StartReminderCandidate = {
  id: string;
  scheduledAt: Date | null;
  startNotifiedAt: Date | null;
};

/**
 * Seleciona os jogos que devem receber o lembrete "seu jogo vai começar":
 * têm horário agendado dentro da janela [agora, agora+lead] e ainda não foram
 * notificados. Função pura (o filtro de status PENDING fica na query).
 */
export function dueForStartReminder<T extends StartReminderCandidate>(
  matches: T[],
  now: Date,
  leadMs: number,
): T[] {
  const from = now.getTime();
  const to = from + leadMs;
  return matches.filter((m) => {
    if (m.startNotifiedAt) return false;
    if (!m.scheduledAt) return false;
    const t = m.scheduledAt.getTime();
    return t >= from && t <= to;
  });
}
