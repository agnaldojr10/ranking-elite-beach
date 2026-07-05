'use client';

import { useEffect, useState } from 'react';

/** Converte a chave pública VAPID (base64url) em Uint8Array p/ o PushManager. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = 'loading' | 'unsupported' | 'off' | 'on' | 'denied';

/** Ativa/desativa as notificações push do atleta. `publicKey` null = push desligado no servidor. */
export function PushToggle({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  useEffect(() => {
    if (!supported || !publicKey) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, [supported, publicKey]);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey!) as BufferSource,
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('Falha ao registrar');
      setState('on');
    } catch {
      setError('Não foi possível ativar as notificações.');
      setState('off');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }

  const row = (right: React.ReactNode) => (
    <div className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface/50 px-4 py-3">
      <div>
        <p className="font-semibold text-ink">Notificações</p>
        <p className="text-xs text-muted">Avisos de jogos, resultados e mudanças de horário.</p>
      </div>
      {right}
    </div>
  );

  if (state === 'loading') return row(<span className="text-sm text-muted">…</span>);
  if (state === 'unsupported')
    return row(<span className="text-xs text-muted">indisponível</span>);
  if (state === 'denied')
    return row(<span className="text-xs text-warn">bloqueadas no navegador</span>);

  const on = state === 'on';
  return (
    <div>
      {row(
        <button
          onClick={on ? disable : enable}
          disabled={busy}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            on ? 'bg-surface-2 text-ink-2' : 'bg-ocean text-ocean-ink'
          }`}
        >
          {busy ? '…' : on ? 'Desativar' : 'Ativar'}
        </button>,
      )}
      {error ? <p className="mt-1 px-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
