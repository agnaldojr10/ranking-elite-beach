'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createSeasonAction, type FormState } from '@/app/seasons/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-ocean px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
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

  const field = 'rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ocean';

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
        <p role="alert" className="w-full rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
