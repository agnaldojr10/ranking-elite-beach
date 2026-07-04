import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Meu Beach — Portal do Jogador',
  description: 'Seus jogos, seus números, sua evolução no Beach Tennis.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Meu Beach',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meu Beach',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#06141a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
