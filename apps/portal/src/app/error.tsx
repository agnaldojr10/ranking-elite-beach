'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-bold text-ink">Algo deu errado</h1>
        <p className="text-ink-2">Não conseguimos carregar seus dados agora.</p>
        <button
          onClick={reset}
          className="h-11 rounded-full bg-ocean px-6 font-semibold text-ocean-ink"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
