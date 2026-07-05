'use client';

import { useEffect } from 'react';

/** Registra o service worker do portal (PWA instalável) de forma best-effort. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* silencioso: PWA é progressivo */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
