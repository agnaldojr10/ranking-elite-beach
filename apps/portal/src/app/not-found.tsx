import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-ink">Página não encontrada</h1>
        <Link href="/" className="h-11 rounded-full bg-ocean px-6 font-semibold leading-[44px] text-ocean-ink">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
