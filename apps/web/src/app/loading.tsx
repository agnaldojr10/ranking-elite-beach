import { BrandMark } from '@/components/ui/BrandMark';

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex flex-col items-center gap-3 text-ink-2">
        <span className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-ocean/15" aria-hidden />
          <BrandMark className="relative h-11 w-11 text-ocean" />
        </span>
        <p className="text-sm">Carregando…</p>
      </div>
    </main>
  );
}
