'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createSeasonAction, type FormState } from '@/app/seasons/actions';
import { buttonClass } from '@/components/ui/Button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Criando…' : 'Criar temporada'}
    </button>
  );
}

export function SeasonCreateForm() {
  const [state, action] = useFormState(createSeasonAction, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const field =
    'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Ano
        <input name="year" type="number" required min={2000} max={2100} className={field} />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Nome
        <input name="name" required placeholder="Temporada 2026" className={field} />
      </label>
      <Submit />
      {state.error && (
        <p role="alert" className="w-full rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
