'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createCalendarEventAction, type FormState } from '@/app/calendar/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : 'Adicionar'}
    </button>
  );
}

export function CalendarEventForm() {
  const [state, action] = useFormState(createCalendarEventAction, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const field = 'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select name="type" defaultValue="TRAINING" className={field}>
          <option value="TRAINING">Treino</option>
          <option value="EVENT">Evento</option>
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Título
        <input name="title" required placeholder="Ex.: Treino coletivo" className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data
        <input name="date" type="date" required className={field} />
      </label>
      <Submit />
      {state.error && (
        <p role="alert" className="w-full rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
