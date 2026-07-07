'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { STAFF_ROLE_HINTS, STAFF_ROLE_LABELS, StaffRoleSchema } from '@reb/contracts';
import { createStaffAction, type FormState } from '@/app/admins/actions';

const field =
  'h-11 rounded-2xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-ocean';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-ocean-ink transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Criando…' : 'Adicionar à equipe'}
    </button>
  );
}

export function StaffForm() {
  const [state, formAction] = useFormState(createStaffAction, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o formulário após criar com sucesso.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input name="email" type="email" required placeholder="pessoa@exemplo.com" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha inicial
          <input name="password" type="text" required minLength={8} placeholder="mín. 8 caracteres" className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Papel
        <select name="role" defaultValue="ADMIN" className={field}>
          {StaffRoleSchema.options.map((r) => (
            <option key={r} value={r}>
              {STAFF_ROLE_LABELS[r]} — {STAFF_ROLE_HINTS[r]}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-ok/10 px-3 py-2 text-sm text-ok">
          Membro adicionado. Passe o e-mail e a senha para a pessoa entrar.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Submit />
        <span className="text-xs text-muted">A senha é definida por você e pode ser trocada depois.</span>
      </div>
    </form>
  );
}
