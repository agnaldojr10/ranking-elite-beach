import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-ocean">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ink-2">
          O endereço acessado não existe ou o item não está mais disponível.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
