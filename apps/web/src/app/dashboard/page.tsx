import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="font-bold text-ocean">Ranking Elite Beach</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">
            {user.email} · <strong>{user.role}</strong>
          </span>
          <LogoutButton />
        </div>
      </header>

      <section className="p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Fundação concluída. Os módulos de jogadores, campeonatos, rodadas e o motor de sorteio
          entram nas próximas sprints.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link href="/players" className="block transition hover:shadow-md">
            <Card title="Jogadores" value="Gerenciar" hint="Cadastro, busca e perfil" />
          </Link>
          <Link href="/championships" className="block transition hover:shadow-md">
            <Card title="Campeonatos" value="Gerenciar" hint="Temporadas, config e pontuação" />
          </Link>
          <Card title="Próxima rodada" value="—" hint="Sprint 4" />
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
