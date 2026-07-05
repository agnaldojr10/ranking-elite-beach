import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { H2HBar } from '@/components/ui/H2HBar';
import { MatchRow } from '@/components/ui/MatchRow';
import { Shell } from '@/components/ui/Shell';
import { getMyH2H } from '@/lib/me';

export const dynamic = 'force-dynamic';

export default async function H2HDetailPage({ params }: { params: { id: string } }) {
  const h2h = await getMyH2H(params.id);
  if (!h2h) notFound();

  const recent = [...h2h.matches].reverse(); // mais recentes primeiro

  return (
    <Shell>
      <Link href="/h2h" className="text-sm text-ocean">
        ‹ Rivais
      </Link>

      <section className="mb-5 mt-2 rounded-3xl border border-line/70 bg-surface/60 p-5">
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={h2h.opponent.name} size={56} />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Retrospecto contra</p>
            <h1 className="text-xl font-bold text-ink">{h2h.opponent.name}</h1>
          </div>
        </div>
        <H2HBar wins={h2h.wins} losses={h2h.losses} />
      </section>

      {recent.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Confrontos</h2>
          <div className="space-y-3">
            {recent.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
