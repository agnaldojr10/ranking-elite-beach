import type { PlayerMatch } from '@reb/contracts';
import { Countdown } from './Countdown';
import { IconClock, IconPin } from './icons';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const wd = WEEKDAYS[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${wd} ${day}/${month} · ${hh}:${mm}`;
}

/** Destaque do próximo jogo do atleta, com contagem regressiva. */
export function NextMatchCard({ match }: { match: PlayerMatch | null }) {
  if (!match) {
    return (
      <section className="rounded-3xl border border-line/70 bg-surface/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Próximo jogo</h2>
        <p className="mt-2 text-ink-2">Nenhum jogo agendado no momento.</p>
      </section>
    );
  }

  const opp = match.opponent.playerNames.filter(Boolean).join(' & ');
  return (
    <section className="relative overflow-hidden rounded-3xl border border-ocean/30 bg-gradient-to-br from-ocean/15 to-surface/70 p-5 shadow-ocean-glow animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ocean">Próximo jogo</h2>
        <span className="rounded-full bg-bg/50 px-2.5 py-1 text-[11px] text-ink-2">
          {match.roundLabel}
        </span>
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-muted">Contra</p>
      <p className="text-xl font-bold text-ink">{opp || 'A definir'}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        {match.scheduledAt ? (
          <span className="inline-flex items-center gap-1.5">
            <IconClock width={16} height={16} className="text-ocean" />
            {formatWhen(match.scheduledAt)}
          </span>
        ) : (
          <span className="text-muted">Horário a confirmar</span>
        )}
        {match.venueName ? (
          <span className="inline-flex items-center gap-1.5">
            <IconPin width={16} height={16} className="text-ocean" />
            {match.venueName}
          </span>
        ) : null}
      </div>

      {match.scheduledAt ? (
        <div className="mt-4 rounded-2xl bg-bg/40 p-3">
          <Countdown target={match.scheduledAt} />
        </div>
      ) : null}
    </section>
  );
}
