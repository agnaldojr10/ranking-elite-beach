import type { PlayerMatch } from '@reb/contracts';
import { Shell } from '@/components/ui/Shell';
import { IconClock, IconPin } from '@/components/ui/icons';
import { getMyMatches } from '@/lib/me';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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

function MatchRow({ m }: { m: PlayerMatch }) {
  const opp = m.opponent.playerNames.filter(Boolean).join(' & ') || 'A definir';
  const score = m.sets?.map((s) => `${s.a}-${s.b}`).join('  ') ?? null;
  const resultChip =
    m.didIWin === null ? null : m.didIWin ? (
      <span className="rounded-full bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok">Vitória</span>
    ) : (
      <span className="rounded-full bg-danger/15 px-2.5 py-1 text-xs font-semibold text-danger">
        Derrota
      </span>
    );

  return (
    <div className="rounded-2xl border border-line/70 bg-surface/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted">{m.roundLabel}</span>
        {resultChip}
      </div>
      <p className="mt-1 font-semibold text-ink">vs {opp}</p>
      {score ? <p className="tabular mt-0.5 text-sm text-ink-2">{score}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {m.scheduledAt ? (
          <span className="inline-flex items-center gap-1.5">
            <IconClock width={14} height={14} />
            {formatWhen(m.scheduledAt)}
          </span>
        ) : null}
        {m.venueName ? (
          <span className="inline-flex items-center gap-1.5">
            <IconPin width={14} height={14} />
            {m.venueName}
          </span>
        ) : null}
      </div>
    </div>
  );
}
