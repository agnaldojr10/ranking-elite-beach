import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { BrandMark } from '@/components/ui/BrandMark';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-ocean/15 text-ocean ring-1 ring-ocean/30">
          <BrandMark className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-ink">Meu Beach</h1>
        <p className="mt-1 text-ink-2">Seus jogos, seus números, sua evolução.</p>
      </div>
      <div className="rounded-3xl border border-line/70 bg-surface/60 p-6 shadow-glow backdrop-blur-sm">
        <LoginForm />
      </div>
    </main>
  );
}
