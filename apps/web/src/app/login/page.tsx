import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-ocean">Ranking Elite Beach</h1>
        <p className="mb-6 text-sm text-slate-500">Entre para gerenciar seus campeonatos</p>
        <LoginForm />
      </div>
    </main>
  );
}
