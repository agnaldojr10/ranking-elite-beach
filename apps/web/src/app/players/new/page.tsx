import Link from 'next/link';
import { PlayerForm } from '@/components/PlayerForm';
import { createPlayerAction } from '../actions';

export default function NewPlayerPage() {
  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/players" className="font-bold text-ocean">
          Jogadores
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Novo</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Novo jogador</h1>
        <PlayerForm action={createPlayerAction} submitLabel="Cadastrar" />
      </section>
    </main>
  );
}
