'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconChart, IconHome, IconUser } from './icons';

const items = [
  { href: '/', label: 'Início', Icon: IconHome },
  { href: '/jogos', label: 'Jogos', Icon: IconChart },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/80 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  active ? 'text-ocean' : 'text-muted hover:text-ink-2'
                }`}
              >
                <Icon width={22} height={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
