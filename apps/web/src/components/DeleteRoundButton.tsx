'use client';

import { useFormStatus } from 'react-dom';
import { deleteRoundAction } from '@/app/rounds/actions';
import { buttonClass } from '@/components/ui/Button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass('danger', 'md', 'disabled:opacity-60')}
      onClick={(e) => {
        if (!confirm('Excluir esta rodada? Inscrições, sorteio e resultados dela serão apagados. Esta ação não pode ser desfeita.')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Excluindo…' : 'Excluir rodada'}
    </button>
  );
}

export function DeleteRoundButton({
  roundId,
  championshipId,
}: {
  roundId: string;
  championshipId: string;
}) {
  const action = deleteRoundAction.bind(null, roundId, championshipId);
  return (
    <form action={action}>
      <Submit />
    </form>
  );
}
