export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ocean" />
        <span className="text-sm">Carregando…</span>
      </div>
    </div>
  );
}
