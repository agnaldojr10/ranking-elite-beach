import { describe, expect, it } from 'vitest';
import { dueForStartReminder } from './push.logic';

const now = new Date('2026-07-05T12:00:00Z');
const LEAD = 30 * 60 * 1000; // 30 min

function m(id: string, minutesFromNow: number | null, notified = false) {
  return {
    id,
    scheduledAt: minutesFromNow === null ? null : new Date(now.getTime() + minutesFromNow * 60_000),
    startNotifiedAt: notified ? new Date() : null,
  };
}

describe('dueForStartReminder', () => {
  it('inclui jogos dentro da janela [agora, agora+lead]', () => {
    const due = dueForStartReminder([m('a', 10), m('b', 30)], now, LEAD);
    expect(due.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('exclui fora da janela (passado ou além do lead)', () => {
    const due = dueForStartReminder([m('past', -5), m('far', 45)], now, LEAD);
    expect(due).toHaveLength(0);
  });

  it('exclui já notificados e sem horário', () => {
    const due = dueForStartReminder([m('notified', 10, true), m('noTime', null)], now, LEAD);
    expect(due).toHaveLength(0);
  });
});
