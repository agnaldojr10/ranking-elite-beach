import Link from 'next/link';
import type { ReactNode } from 'react';

type TileProps = {
  children: ReactNode;
  className?: string;
  /** classes de span do grid (ex.: "sm:col-span-2 lg:row-span-2") */
  span?: string;
  variant?: 'plain' | 'accent';
  href?: string;
};

const base =
  'rounded-3xl border border-line bg-surface p-5 shadow-tile';
const accent =
  'rounded-3xl border border-transparent bg-ocean p-5 text-ocean-ink shadow-tile';
const interactive =
  'transition duration-200 hover:-translate-y-0.5 hover:shadow-tile-hover focus-visible:-translate-y-0.5';

/** Cartão bento. Use `href` para torná-lo um atalho clicável. */
export function Tile({ children, className = '', span = '', variant = 'plain', href }: TileProps) {
  const cls = `${variant === 'accent' ? accent : base} ${span} ${className}`;
  if (href) {
    return (
      <Link href={href} className={`block ${cls} ${interactive}`}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}
