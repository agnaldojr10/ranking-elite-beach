import Link from 'next/link';
import { ROUND_STATUS_LABELS, roundLabel } from '@reb/contracts';
import { Shell } from '@/components/ui/Shell';
import { getOperableRounds } from '@/lib/rounds';

export const dynamic = 'force-dynamic';

export default async function RodadasPage() {
  const rounds = await getOperableRounds();

  return (
    <Shell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Operar rodada</h1>
        <p className="mt-1 text-sm text-ink-2">
          Qualquer atleta pode marcar os presentes, sortear as duplas, lançar os placares e gerar o
          relatório do dia.
        </p>
      </header>

      {rounds.length === 0 ? (
        <p className="rounded-3xl border border-line/70 bg-surface/60 p-5 text-sm text-muted">
          Nenhuma rodada disponível no campeonato ativo.
        </p>
      ) : (
        <ul className="space-y-3">
          {rounds.map((r) => {
            const finished = r.status === 'FINISHED';
            return (
              <li key={r.id}>
                <Link
                  href={`/rodada/${r.id}`}
                  className="flex items-center justify-between rounded-3xl border border-line/70 bg-surface/60 p-5 transition hover:border-ocean/50"
                >
                  <div>
                    <p className="font-bold text-ink">{roundLabel(r)}</p>
                    <p className="mt-0.5 text-sm text-ink-2">
                      {r.date ? `${r.date.slice(8, 10)}/${r.date.slice(5, 7)} · ` : ''}
                      {r.summary.confirmed} confirmados
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      finished ? 'bg-gold/15 text-gold' : 'bg-bg/50 text-ink-2'
                    }`}
                  >
                    {ROUND_STATUS_LABELS[r.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}
