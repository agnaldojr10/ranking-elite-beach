'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import type { FormState } from '@/app/venues/actions';

type Defaults = { name?: string; number?: number | null; location?: string | null };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-ocean px-4 py-2 font-medium text-ocean-ink hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Salvando…' : label}
    </button>
  );
}

export function VenueForm({
  action,
  defaults = {},
  submitLabel = 'Salvar',
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {} as FormState);
  const field = 'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-ink outline-none focus:border-ocean';

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nome*
        <input name="name" required defaultValue={defaults.name} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Número
          <input
            name="number"
            type="number"
            min={0}
            max={999}
            defaultValue={defaults.number ?? ''}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Local
          <input name="location" defaultValue={defaults.location ?? ''} className={field} />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Submit label={submitLabel} />
        <Link href="/venues" className="text-sm text-ink-2 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
