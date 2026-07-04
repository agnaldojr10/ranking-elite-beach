export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-ink-2">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ocean"
          aria-hidden
        />
        <p className="text-sm">Carregando…</p>
      </div>
    </main>
  );
}
