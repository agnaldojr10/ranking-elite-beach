'use client';

import { useFormStatus } from 'react-dom';
import { revertKnockoutAction } from '@/app/rounds/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-60"
      onClick={(e) => {
        if (
          !confirm(
            'Reverter o mata-mata? A chave e a colocação/pontos desta rodada serão apagados e a rodada volta para "em andamento" — aí você corrige o placar do grupo e gera de novo. As duplas e o sorteio são mantidos.',
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Revertendo…' : 'Reverter mata-mata'}
    </button>
  );
}

export function RevertKnockoutButton({ roundId }: { roundId: string }) {
  const action = revertKnockoutAction.bind(null, roundId);
  return (
    <form action={action}>
      <Submit />
    </form>
  );
}
