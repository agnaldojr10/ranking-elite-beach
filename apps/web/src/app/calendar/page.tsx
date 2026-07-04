import Link from 'next/link';
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarItem } from '@reb/contracts';
import { CalendarEventForm } from '@/components/CalendarEventForm';
import { getCalendar } from '@/lib/calendar';
import { deleteCalendarEventAction } from './actions';

function monthBounds(month: string): { from: string; to: string; label: string } {
  const [y, m] = month.split('-').map(Number);
  const year = y!;
  const mi = (m ?? 1) - 1;
  const last = new Date(year, mi + 1, 0).getDate();
  const mm = String(mi + 1).padStart(2, '0');
  const label = new Date(year, mi, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}`, label };
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y!, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const BADGE: Record<string, string> = {
  ROUND: 'bg-ocean/10 text-ocean',
  FINAL: 'bg-warn/15 text-warn',
  EVENT: 'bg-ocean/10 text-ocean',
  TRAINING: 'bg-ok/15 text-ok',
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? '') ? searchParams.month! : defaultMonth;
  const { from, to, label } = monthBounds(month);
  const items = await getCalendar(from, to);

  const byDate = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const list = byDate.get(it.date) ?? [];
    list.push(it);
    byDate.set(it.date, list);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" className="font-bold text-ocean">
          Ranking Elite Beach
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Agenda</span>
      </header>

      <section className="space-y-6 p-6">
        <div className="mb-2 flex items-center gap-4">
          <Link href={`/calendar?month=${shiftMonth(month, -1)}`} className="rounded-md border border-line px-3 py-1 text-sm hover:bg-surface-2">
            ‹
          </Link>
          <h1 className="text-lg font-semibold capitalize">{label}</h1>
          <Link href={`/calendar?month=${shiftMonth(month, 1)}`} className="rounded-md border border-line px-3 py-1 text-sm hover:bg-surface-2">
            ›
          </Link>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <h2 className="mb-3 font-semibold">Novo evento/treino</h2>
          <CalendarEventForm />
        </div>

        {dates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-2">
            Nada agendado neste mês.
          </div>
        ) : (
          <div className="space-y-4">
            {dates.map((date) => (
              <div key={date} className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
                <p className="mb-2 text-sm font-medium text-ink-2">
                  {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
                <ul className="space-y-2">
                  {byDate.get(date)!.map((it) => {
                    const remove = it.manual ? deleteCalendarEventAction.bind(null, it.id) : null;
                    return (
                      <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[it.type]}`}>
                            {CALENDAR_EVENT_TYPE_LABELS[it.type]}
                          </span>
                          {it.refId ? (
                            <Link href={`/rounds/${it.refId}`} className="text-ocean hover:underline">
                              {it.title}
                            </Link>
                          ) : (
                            <span>{it.title}</span>
                          )}
                        </span>
                        {remove && (
                          <form action={remove}>
                            <button className="text-xs text-danger hover:underline">remover</button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
