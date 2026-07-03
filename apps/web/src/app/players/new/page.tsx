import Link from 'next/link';
import { PlayerForm } from '@/components/PlayerForm';
import { createPlayerAction } from '../actions';

export default function NewPlayerPage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/players" className="font-bold text-ocean">
          Jogadores
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Novo</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Novo jogador</h1>
        <PlayerForm action={createPlayerAction} submitLabel="Cadastrar" />
      </section>
    </main>
  );
}
