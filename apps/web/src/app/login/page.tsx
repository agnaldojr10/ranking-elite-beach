import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { IconWhistle } from '@/components/ui/icons';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* Fundo praiano sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 0%, rgb(var(--c-ocean) / 0.16), transparent 70%), radial-gradient(50% 40% at 0% 100%, rgb(var(--c-coral) / 0.12), transparent 70%)',
        }}
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-tile">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean text-ocean-ink shadow-tile">
            <IconWhistle width={28} height={28} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Ranking Elite Beach</h1>
          <p className="mt-1 text-sm text-ink-2">Entre para gerenciar seus campeonatos</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
