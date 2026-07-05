import { Shell } from '@/components/ui/Shell';
import { MatchRow } from '@/components/ui/MatchRow';
import { getMyMatches } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function JogosPage() {
  const matches = await getMyMatches();
  const upcoming = matches.filter((m) => m.status === 'PENDING');
  const played = matches.filter((m) => m.status !== 'PENDING');

  return (
    <Shell>
      <h1 className="mb-5 text-xl font-bold text-ink">Meus jogos</h1>

      {matches.length === 0 ? (
        <p className="rounded-3xl border border-line/70 bg-surface/50 p-6 text-center text-ink-2">
          Você ainda não tem jogos registrados.
        </p>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <Section title="A jogar">
              {upcoming.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </Section>
          ) : null}
          {played.length > 0 ? (
            <Section title="Histórico">
              {played.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </Section>
          ) : null}
        </div>
      )}
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
