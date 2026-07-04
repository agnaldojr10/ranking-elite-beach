import type { DrawMetrics } from '@reb/contracts';

export type TeamExplainInput = {
  label: string;
  aName: string;
  bName: string;
  aStrength: number;
  bStrength: number;
  timesTogether: number;
};

/**
 * Gera frases legíveis derivadas dos termos que mais pesaram em cada decisão
 * (SORT_ENGINE §9), não texto genérico.
 */
export function generateExplanations(
  teams: TeamExplainInput[],
  metrics: DrawMetrics,
  allowRepeatPartners: boolean,
): string[] {
  const out: string[] = [];

  // Duplas mais complementares (forte + fraco) — BR-15.
  const byComplement = [...teams].sort(
    (a, b) => Math.abs(b.aStrength - b.bStrength) - Math.abs(a.aStrength - a.bStrength),
  );
  for (const t of byComplement.slice(0, 4)) {
    const gap = Math.abs(t.aStrength - t.bStrength);
    if (gap >= 25) {
      out.push(
        `${t.label}: ${t.aName} foi pareado com ${t.bName} para equilibrar a força (${t.aStrength} + ${t.bStrength}).`,
      );
    }
  }

  // Diversidade de parceiros — BR-13/14.
  if (metrics.repeatedPartners === 0) {
    out.push('Todas as duplas são inéditas: nenhum par de parceiros repetiu (diversidade 100%).');
  } else {
    const repeated = teams.filter((t) => t.timesTogether > 0);
    for (const t of repeated.slice(0, 2)) {
      out.push(
        `${t.label}: ${t.aName} e ${t.bName} já jogaram juntos ${t.timesTogether}x — repetição ${allowRepeatPartners ? 'permitida por configuração' : 'inevitável nesta rodada (fallback à menor repetição)'}.`,
      );
    }
  }

  // Equilíbrio entre grupos — BR-15.
  if (metrics.groupBalance <= 20) {
    out.push(`Grupos equilibrados em força (variação de apenas ${metrics.groupBalance} pontos).`);
  } else {
    out.push(`Distribuição buscou equilibrar a força entre os grupos (variação de ${metrics.groupBalance} pontos).`);
  }

  if (metrics.repeatedOpponents === 0) {
    out.push('Nenhum confronto repete adversários já enfrentados.');
  }

  return out;
}
