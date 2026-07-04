'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-ocean">Algo deu errado</h1>
        <p className="mt-2 text-sm text-ink-2">
          Não foi possível carregar esta tela. Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
