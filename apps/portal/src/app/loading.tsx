import { BrandMark } from '@/components/ui/BrandMark';

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex animate-fade-up flex-col items-center gap-4">
        <span className="relative grid h-20 w-20 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-ocean/20" aria-hidden />
          <BrandMark className="relative h-14 w-14 text-ocean" />
        </span>
        <p className="text-lg font-bold text-ink">Meu Beach</p>
        <p className="text-sm text-muted">Carregando…</p>
      </div>
    </div>
  );
}
